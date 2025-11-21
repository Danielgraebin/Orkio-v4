"""
Serviço RAG (Retrieval-Augmented Generation) v4.0
- Busca vetorial com pgvector
- Injeção de contexto no prompt
- Logging de eventos RAG
"""
import os
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from openai import OpenAI

from app.models.models import KnowledgeChunk, Document, RAGEvent


class RAGService:
    """
    Serviço para busca vetorial e recuperação de contexto.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = "text-embedding-3-small"
        self.top_k = 5  # Número de chunks mais relevantes
        self.similarity_threshold = 0.6  # Threshold de similaridade (0-1) - ajustado para melhor recall
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Gera embedding para a query do usuário.
        """
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=query,
            encoding_format="float"
        )
        return response.data[0].embedding
    
    def search_similar_chunks(
        self,
        query_embedding: List[float],
        agent_id: int,
        top_k: Optional[int] = None
    ) -> List[Tuple[KnowledgeChunk, float]]:
        """
        Busca chunks similares usando pgvector.
        
        Returns:
            List[(chunk, similarity_score)]
        """
        if top_k is None:
            top_k = self.top_k
        
        # Query SQL com pgvector para busca por similaridade de cosseno
        # Filtra por agent_id através do join com documents
        query = text("""
            SELECT 
                kc.id,
                kc.document_id,
                kc.content,
                kc.chunk_index,
                kc.embedding,
                kc.created_at,
                1 - (kc.embedding <=> :query_embedding::vector) as similarity
            FROM knowledge_chunks kc
            JOIN documents d ON kc.document_id = d.id
            WHERE d.agent_id = :agent_id
                AND d.status = 'READY'
                AND kc.embedding IS NOT NULL
            ORDER BY kc.embedding <=> :query_embedding::vector
            LIMIT :top_k
        """)
        
        result = self.db.execute(
            query,
            {
                "query_embedding": query_embedding,
                "agent_id": agent_id,
                "top_k": top_k
            }
        )
        
        chunks_with_scores = []
        for row in result:
            # Criar objeto KnowledgeChunk manualmente
            chunk = KnowledgeChunk(
                id=row.id,
                document_id=row.document_id,
                content=row.content,
                chunk_index=row.chunk_index,
                embedding=row.embedding,
                created_at=row.created_at
            )
            similarity = float(row.similarity)
            
            # Filtrar por threshold
            if similarity >= self.similarity_threshold:
                chunks_with_scores.append((chunk, similarity))
        
        return chunks_with_scores
    
    def build_rag_context(self, chunks_with_scores: List[Tuple[KnowledgeChunk, float]]) -> str:
        """
        Constrói contexto formatado a partir dos chunks recuperados.
        """
        if not chunks_with_scores:
            return ""
        
        context_parts = ["=== CONTEXTO RELEVANTE ===\n"]
        
        MAX_CHUNK_LENGTH = 500  # Limitar chunks para evitar respostas brutas
        
        for idx, (chunk, score) in enumerate(chunks_with_scores, 1):
            # Truncar chunk se muito longo
            chunk_content = chunk.content
            if len(chunk_content) > MAX_CHUNK_LENGTH:
                chunk_content = chunk_content[:MAX_CHUNK_LENGTH] + "..."
            
            context_parts.append(f"[Fonte {idx}] (Relevância: {score:.2f})")
            context_parts.append(chunk_content)
            context_parts.append("")  # Linha em branco
        
        context_parts.append("=== FIM DO CONTEXTO ===\n")
        
        return "\n".join(context_parts)
    
    def inject_context_into_system_prompt(
        self,
        original_system_prompt: str,
        rag_context: str
    ) -> str:
        """
        Injeta contexto RAG no system prompt.
        """
        if not rag_context:
            return original_system_prompt
        
        injected_prompt = f"""{original_system_prompt}

{rag_context}

INSTRUÇÕES CRÍTICAS PARA USO DO CONTEXTO:
1. RESUMA as informações - NÃO copie literalmente
2. SINTETIZE em 2-4 frases concisas - NÃO despeje texto bruto
3. FILTRE apenas o relevante - NÃO inclua tudo
4. CITE fontes naturalmente
5. ADAPTE linguagem para ser clara e direta
6. MÁXIMO de 150 palavras na resposta (exceto se usuário pedir detalhes)
7. Se contexto insuficiente, diga claramente
"""
        
        return injected_prompt
    
    def log_rag_event(
        self,
        conversation_id: int,
        message_id: int,
        query: str,
        chunks_retrieved: int,
        chunks_used: int
    ):
        """
        Registra evento RAG para análise posterior.
        """
        rag_event = RAGEvent(
            conversation_id=conversation_id,
            message_id=message_id,
            query=query,
            chunks_retrieved=chunks_retrieved,
            chunks_used=chunks_used
        )
        self.db.add(rag_event)
        self.db.commit()
    
    def retrieve_and_augment(
        self,
        query: str,
        agent_id: int,
        conversation_id: int,
        message_id: int,
        original_system_prompt: str
    ) -> Tuple[str, int, List[dict]]:
        """
        Pipeline completo de RAG:
        1. Gera embedding da query
        2. Busca chunks similares
        3. Constrói contexto
        4. Injeta no system prompt
        5. Loga evento
        
        Returns:
            (augmented_system_prompt, chunks_used, rag_sources)
        """
        # 1. Gerar embedding da query
        query_embedding = self.generate_query_embedding(query)
        
        # 2. Buscar chunks similares
        chunks_with_scores = self.search_similar_chunks(query_embedding, agent_id)
        
        # 3. Construir contexto
        rag_context = self.build_rag_context(chunks_with_scores)
        
        # 4. Injetar no system prompt
        augmented_prompt = self.inject_context_into_system_prompt(
            original_system_prompt,
            rag_context
        )
        
        # 5. Preparar sources para frontend
        rag_sources = []
        for chunk, score in chunks_with_scores:
            # Buscar documento
            doc = self.db.query(Document).filter(Document.id == chunk.document_id).first()
            if doc:
                rag_sources.append({
                    "document_title": doc.filename,
                    "chunk_id": chunk.id,
                    "relevance": round(score, 2)
                })
        
        # 6. Logar evento
        chunks_used = len(chunks_with_scores)
        self.log_rag_event(
            conversation_id=conversation_id,
            message_id=message_id,
            query=query,
            chunks_retrieved=chunks_used,
            chunks_used=chunks_used
        )
        
        return augmented_prompt, chunks_used, rag_sources

