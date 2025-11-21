from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Agent, User, UserAgent
from app.core.security import get_current_user
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/agents")
def list_agents_for_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all agents for the current user's tenant.
    Used by Users Console to populate agent selection dropdowns.
    """
    # Query agents bound to this user via user_agents table
    # If no bindings exist, auto-bind default agents
    user_agent_ids = db.query(UserAgent.agent_id).filter(
        UserAgent.user_id == current_user.id
    ).all()
    
    if not user_agent_ids:
        # Auto-bind default agents (owner_id=1) + enabled_for_users
        default_agents = db.query(Agent).filter(
            Agent.owner_id == 1,
            Agent.enabled_for_users == True  # v3.9.0: filtro
        ).all()
        for agent in default_agents:
            user_agent = UserAgent(user_id=current_user.id, agent_id=agent.id)
            db.add(user_agent)
        db.commit()
        agents = default_agents
    else:
        agent_ids = [ua[0] for ua in user_agent_ids]
        agents = db.query(Agent).filter(
            Agent.id.in_(agent_ids),
            Agent.enabled_for_users == True  # v3.9.0: filtro
        ).all()
    
    return [
        {
            "id": a.id,
            "name": a.name,
            "purpose": a.purpose,
            "temperature": a.temperature,
            "use_rag": a.use_rag,
            "has_rag": a.use_rag  # Alias for compatibility
        }
        for a in agents
    ]

