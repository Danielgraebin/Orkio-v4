# api/users/playground_u.py
# v3.9.0: Playground com RAG real conforme patch
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Agent, User
from app.services.rag_service import get_tenant_settings, retrieve_context
from app.services.llm_manager import chat_completion as llm_chat
from app.core.security import get_current_user
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

class PlaygroundRun(BaseModel):
    prompt: str
    agent_id: int

@router.post("/run")
def playground_run(
    payload: PlaygroundRun,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Playground endpoint com RAG real.
    v3.9.0: Usa agent_documents e rag_service
    """
    agent = db.query(Agent).filter(
        Agent.id==payload.agent_id,
        Agent.enabled_for_users==True
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="no_agent_found")
    
    tenant_id = 1  # Stub
    ts = get_tenant_settings(db, tenant_id)
    
    # RAG: Recuperar contexto
    start = time.time()
    ctx, hits = ([], 0)
    if agent.use_rag:
        ctx, hits = retrieve_context(db, tenant_id, agent.id, payload.prompt)
    
    # Montar mensagens
    msgs = [{"role": "system", "content": agent.purpose or "You are a helpful assistant."}]
    
    if ctx:
        msgs.append({"role": "system", "content": "Knowledge:\n" + "\n\n".join(ctx)})
    
    msgs.append({"role": "user", "content": payload.prompt})
    
    # Chamar LLM
    try:
        out = llm_chat(
            messages=msgs,
            model=agent.llm_model or ts["model"],
            temperature=agent.temperature or ts["temperature"]
        )
        
        ms = int((time.time()-start)*1000)
        
        return {
            "status": "done",
            "output_text": out,
            "usage": {"oh": 1, "dp": 0, "mcc": 0},
            "latency_ms": ms
        }
    
    except Exception as e:
        logger.exception("Playground failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health():
    return {"ok": True}

