"""
Rotas Admin v4 - Agent Links (Orchestration)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json

from app.db.database import get_db
from app.models.models import AgentLink, Agent, Membership
from app.core.auth_v4 import get_current_user, CurrentUser

router = APIRouter()


class AgentLinkCreate(BaseModel):
    from_agent_id: int
    to_agent_id: int
    trigger_keywords: List[str]
    priority: int = 0


class AgentLinkResponse(BaseModel):
    id: int
    from_agent_id: int
    from_agent_name: str
    to_agent_id: int
    to_agent_name: str
    trigger_keywords: List[str]
    priority: int
    active: bool
    created_at: str
    
    class Config:
        from_attributes = True


@router.get("/agent-links", response_model=dict)
def list_agent_links(
    agent_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista links de orquestração entre agents.
    """
    # Verificar permissão
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.user_id,
        Membership.tenant_id == current_user.tenant_id
    ).first()
    
    if not membership or membership.role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    
    # Query base
    query = db.query(AgentLink, Agent.name.label("from_name"), Agent.name.label("to_name")).join(
        Agent, AgentLink.from_agent_id == Agent.id
    ).filter(
        AgentLink.tenant_id == current_user.tenant_id
    )
    
    # Filtro por agent
    if agent_id:
        query = query.filter(
            (AgentLink.from_agent_id == agent_id) | (AgentLink.to_agent_id == agent_id)
        )
    
    results = query.all()
    
    links = []
    for link, from_name, to_name in results:
        # Parse keywords
        try:
            keywords = json.loads(link.trigger_keywords) if link.trigger_keywords else []
        except:
            keywords = []
        
        # Buscar nomes dos agents
        from_agent = db.query(Agent).filter(Agent.id == link.from_agent_id).first()
        to_agent = db.query(Agent).filter(Agent.id == link.to_agent_id).first()
        
        links.append({
            "id": link.id,
            "from_agent_id": link.from_agent_id,
            "from_agent_name": from_agent.name if from_agent else "Unknown",
            "to_agent_id": link.to_agent_id,
            "to_agent_name": to_agent.name if to_agent else "Unknown",
            "trigger_keywords": keywords,
            "priority": link.priority,
            "active": link.active,
            "created_at": link.created_at.isoformat() if link.created_at else None
        })
    
    return {"links": links}


@router.post("/agent-links", response_model=dict, status_code=201)
def create_agent_link(
    link_data: AgentLinkCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria link de orquestração entre dois agents.
    """
    # Verificar permissão
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.user_id,
        Membership.tenant_id == current_user.tenant_id
    ).first()
    
    if not membership or membership.role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    
    # Verificar se agents existem
    from_agent = db.query(Agent).filter(
        Agent.id == link_data.from_agent_id,
        Agent.tenant_id == current_user.tenant_id
    ).first()
    
    to_agent = db.query(Agent).filter(
        Agent.id == link_data.to_agent_id,
        Agent.tenant_id == current_user.tenant_id
    ).first()
    
    if not from_agent or not to_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Evitar link circular (agent -> agent)
    if link_data.from_agent_id == link_data.to_agent_id:
        raise HTTPException(status_code=400, detail="Cannot link agent to itself")
    
    # Criar link
    link = AgentLink(
        tenant_id=current_user.tenant_id,
        from_agent_id=link_data.from_agent_id,
        to_agent_id=link_data.to_agent_id,
        trigger_keywords=json.dumps(link_data.trigger_keywords),
        priority=link_data.priority,
        active=True
    )
    
    db.add(link)
    db.commit()
    db.refresh(link)
    
    return {
        "link": {
            "id": link.id,
            "from_agent_id": link.from_agent_id,
            "from_agent_name": from_agent.name,
            "to_agent_id": link.to_agent_id,
            "to_agent_name": to_agent.name,
            "trigger_keywords": link_data.trigger_keywords,
            "priority": link.priority,
            "active": link.active,
            "created_at": link.created_at.isoformat() if link.created_at else None
        }
    }


@router.delete("/agent-links/{link_id}", status_code=204)
def delete_agent_link(
    link_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove link de orquestração.
    """
    # Verificar permissão
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.user_id,
        Membership.tenant_id == current_user.tenant_id
    ).first()
    
    if not membership or membership.role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    
    # Buscar link
    link = db.query(AgentLink).filter(
        AgentLink.id == link_id,
        AgentLink.tenant_id == current_user.tenant_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Deletar
    db.delete(link)
    db.commit()
    
    return None


@router.patch("/agent-links/{link_id}/toggle", response_model=dict)
def toggle_agent_link(
    link_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ativa/desativa link de orquestração.
    """
    # Verificar permissão
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.user_id,
        Membership.tenant_id == current_user.tenant_id
    ).first()
    
    if not membership or membership.role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    
    # Buscar link
    link = db.query(AgentLink).filter(
        AgentLink.id == link_id,
        AgentLink.tenant_id == current_user.tenant_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Toggle active
    link.active = not link.active
    db.commit()
    
    return {
        "link": {
            "id": link.id,
            "active": link.active
        }
    }

