# app/api/users/conversations.py
# v3.9.0: Endpoints de threads (conversations)
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal
from app.models.models import User
from app.core.security import get_current_user
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Models ---

class CreateConversationRequest(BaseModel):
    agent_id: int
    title: Optional[str] = None

class ConversationResponse(BaseModel):
    id: int
    agent_id: int
    title: Optional[str]
    created_at: str
    message_count: int

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str

# --- Endpoints ---

@router.post("/conversations")
def create_conversation(
    payload: CreateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar nova conversa (thread).
    POST /u/conversations
    Body: {"agent_id": 6, "title": "Estratégia Q1 2025"}
    """
    try:
        result = db.execute(text("""
            INSERT INTO conversations (tenant_id, agent_id, user_id, title, created_at)
            VALUES (1, :agent_id, :user_id, :title, NOW())
            RETURNING id
        """), {
            'agent_id': payload.agent_id,
            'user_id': current_user.id,
            'title': payload.title or "Nova conversa"
        })
        conversation_id = result.scalar()
        db.commit()
        
        return {"id": conversation_id, "agent_id": payload.agent_id, "title": payload.title}
        
    except Exception as e:
        db.rollback()
        logger.exception("Create conversation failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar conversas do usuário.
    GET /u/conversations?user_id={id}
    """
    try:
        result = db.execute(text("""
            SELECT 
                c.id, 
                c.agent_id, 
                c.title, 
                c.created_at,
                COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN conversation_messages m ON m.conversation_id = c.id
            WHERE c.user_id = :user_id
            GROUP BY c.id, c.agent_id, c.title, c.created_at
            ORDER BY c.created_at DESC
        """), {'user_id': current_user.id})
        
        conversations = []
        for row in result:
            conversations.append({
                "id": row.id,
                "agent_id": row.agent_id,
                "title": row.title,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "message_count": row.message_count or 0
            })
        
        return {"items": conversations, "total": len(conversations)}
        
    except Exception as e:
        logger.exception("List conversations failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar mensagens de uma conversa.
    GET /u/conversations/{conversation_id}/messages
    """
    try:
        # Verificar se conversa pertence ao usuário
        result = db.execute(text("""
            SELECT id FROM conversations 
            WHERE id = :conversation_id AND user_id = :user_id
        """), {'conversation_id': conversation_id, 'user_id': current_user.id})
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="conversation_not_found")
        
        # Buscar mensagens
        result = db.execute(text("""
            SELECT id, role, content, created_at
            FROM conversation_messages
            WHERE conversation_id = :conversation_id
            ORDER BY created_at ASC
        """), {'conversation_id': conversation_id})
        
        messages = []
        for row in result:
            messages.append({
                "id": row.id,
                "role": row.role,
                "content": row.content,
                "created_at": row.created_at.isoformat() if row.created_at else None
            })
        
        return {"items": messages, "total": len(messages)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Get messages failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar conversa (e mensagens via CASCADE).
    DELETE /u/conversations/{conversation_id}
    """
    try:
        # Verificar se conversa pertence ao usuário
        result = db.execute(text("""
            DELETE FROM conversations 
            WHERE id = :conversation_id AND user_id = :user_id
            RETURNING id
        """), {'conversation_id': conversation_id, 'user_id': current_user.id})
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="conversation_not_found")
        
        db.commit()
        return {"deleted": True, "conversation_id": conversation_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Delete conversation failed")
        raise HTTPException(status_code=500, detail=str(e))



# --- Renomear Conversa ---

class UpdateConversationRequest(BaseModel):
    title: str

@router.patch("/conversations/{conversation_id}")
def update_conversation(
    conversation_id: int,
    payload: UpdateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Renomear conversa.
    PATCH /u/conversations/{id}
    Body: {"title": "Planejamento Estratégico 2025"}
    """
    # Verificar se conversa pertence ao usuário
    try:
        result = db.execute(text("""
            SELECT id FROM conversations 
            WHERE id = :conversation_id AND user_id = :user_id
        """), {'conversation_id': conversation_id, 'user_id': current_user.id})
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Atualizar título
        db.execute(text("""
            UPDATE conversations 
            SET title = :title 
            WHERE id = :conversation_id
        """), {'title': payload.title, 'conversation_id': conversation_id})
        db.commit()
        
        return {
            "ok": True,
            "conversation_id": conversation_id,
            "title": payload.title
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Update conversation failed")
        raise HTTPException(status_code=500, detail=str(e))



# --- Upload de Anexos ---

from fastapi import UploadFile, File, Form
from app.services.knowledge import extract_text, vectorize_document
from app.models.models import KnowledgeItem, AgentDocument
import uuid
import hashlib

@router.post("/conversations/{conversation_id}/attachments")
async def upload_attachment(
    conversation_id: int,
    file: UploadFile = File(...),
    agent_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload de arquivo via chat.
    POST /u/conversations/{id}/attachments
    Form: file, agent_id
    """
    # Verificar se conversa pertence ao usuário
    try:
        result = db.execute(text("""
            SELECT id FROM conversations 
            WHERE id = :conversation_id AND user_id = :user_id
        """), {'conversation_id': conversation_id, 'user_id': current_user.id})
        
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Ler arquivo
        raw = await file.read()
        
        # Criar documento
        doc_id = str(uuid.uuid4())
        doc = KnowledgeItem(
            id=doc_id,
            tenant_id=1,
            filename=file.filename,
            mime=file.content_type,
            size=len(raw),
            tags=["chat_upload", f"conversation_{conversation_id}"],
            checksum=hashlib.sha256(raw).hexdigest(),
            status="processing",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Extrair + vetorizar
        try:
            text = extract_text(file, raw)
            result = vectorize_document(db, 1, doc.id, text)
        except Exception as e:
            db.query(KnowledgeItem).filter(KnowledgeItem.id==doc.id).update({"status": "error", "error_reason": str(e)})
            db.commit()
            raise HTTPException(status_code=500, detail=f"Vectorization failed: {e}")
        
        # Criar vínculo com agente
        try:
            db.add(AgentDocument(agent_id=agent_id, document_id=doc.id))
            db.commit()
        except Exception:
            db.rollback()  # Ignora duplicatas
        
        return {
            "ok": True,
            "document_id": doc.id,
            "filename": file.filename,
            "status": "vectorized"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload attachment failed")
        raise HTTPException(status_code=500, detail=str(e))

