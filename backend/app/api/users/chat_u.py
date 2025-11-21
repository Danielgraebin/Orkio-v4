# api/users/chat_u.py
# v3.9.0: Chat com RAG real conforme patch
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal
from app.models.models import Agent, User
from app.services.rag_service_v37 import retrieve_context
from app.services.llm_manager import chat_completion as llm_chat
from app.core.security import get_current_user
from typing import List, Literal, Optional
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    agent_id: int
    message: str
    conversation_id: Optional[int] = None  # Se None, cria nova conversa
    history: List[ChatMessage] = []  # Deprecated: usar conversation_id

@router.post("/chat")
def user_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chat endpoint com RAG real.
    v3.9.0: Usa agent_documents e rag_service
    """
    # Verificar aprovação
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Acesso pendente de aprovação")
    
    # Buscar agente
    agent = db.query(Agent).filter(
        Agent.id==payload.agent_id,
        Agent.enabled_for_users==True
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="no_agent_found")
    
    tenant_id = 1  # Hardcoded para MVP (User não tem tenant_id)
    
    # RAG: Recuperar contexto
    start = time.time()
    context_blocks, hits = ([], 0)
    if agent.use_rag:
        context_blocks, hits = retrieve_context(db, tenant_id=tenant_id, agent_id=agent.id, query=payload.message)
    
    # Montar mensagens
    messages = [{"role": "system", "content": agent.purpose or "You are a helpful assistant."}]
    
    if context_blocks:
        ctx = "\n\n".join(context_blocks)
        messages.append({"role": "system", "content": f"Use the following knowledge base excerpts when relevant:\n{ctx}"})
    
    # Adicionar histórico
    for msg in payload.history:
        messages.append({"role": msg.role, "content": msg.content})
    
    # Adicionar mensagem atual
    messages.append({"role": "user", "content": payload.message})
    
    # Circuit breaker: se RAG habilitado mas sem hits, não chamar LLM
    if agent.use_rag and hits == 0:
        logger.warning(f"Circuit breaker: agent {agent.id} sem base, não chamando LLM")
        return {
            "reply": "Não encontrei informações relevantes na base de conhecimento para responder com segurança. Deseja vincular documentos ao agente?",
            "circuit_breaker": True
        }
    
    # Gerenciar conversation_id
    conversation_id = payload.conversation_id
    
    # Se não tiver conversation_id, criar nova conversa
    if not conversation_id:
        try:
            result = db.execute(text("""
                INSERT INTO conversations (tenant_id, agent_id, user_id, title, created_at)
                VALUES (1, :agent_id, :user_id, :title, NOW())
                RETURNING id
            """), {
                'agent_id': agent.id,
                'user_id': current_user.id,
                'title': payload.message[:50] + "..." if len(payload.message) > 50 else payload.message
            })
            conversation_id = result.scalar()
            db.commit()
        except Exception as e:
            logger.exception("Failed to create conversation")
            db.rollback()
    
    # Persistir mensagem do usuário
    if conversation_id:
        try:
            db.execute(text("""
                INSERT INTO conversation_messages (conversation_id, role, content, created_at)
                VALUES (:conversation_id, 'user', :content, NOW())
            """), {'conversation_id': conversation_id, 'content': payload.message})
            db.commit()
        except Exception as e:
            logger.exception("Failed to save user message")
            db.rollback()
    
    # Chamar LLM
    try:
        out = llm_chat(
            messages=messages,
            model=agent.llm_model or "gpt-4.1-mini",  # Modelo suportado pelo Manus proxy
            temperature=agent.temperature or 0.7
        )
        
        # Persistir resposta do assistente
        if conversation_id:
            try:
                db.execute(text("""
                    INSERT INTO conversation_messages (conversation_id, role, content, created_at)
                    VALUES (:conversation_id, 'assistant', :content, NOW())
                """), {'conversation_id': conversation_id, 'content': out})
                db.commit()
            except Exception as e:
                logger.exception("Failed to save assistant message")
                db.rollback()
        
        return {"reply": out, "conversation_id": conversation_id}
    
    except ValueError as e:
        # Erro 4xx da OpenAI (client error)
        logger.error(f"LLM client error: {e}")
        raise HTTPException(status_code=424, detail=f"LLM dependency failed: {str(e)}")
    
    except Exception as e:
        # Erro 5xx ou timeout
        logger.exception("LLM server error or timeout")
        raise HTTPException(status_code=502, detail=f"LLM service unavailable: {str(e)}")

