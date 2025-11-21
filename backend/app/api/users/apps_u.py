from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import App
from app.core.security import get_current_user_tenant

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AppCreate(BaseModel):
    name: str
    description: str | None = None

@router.get("")
def list_apps(db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    apps = db.query(App).filter(App.tenant_id == tenant_id).all()
    return apps

@router.post("")
def create_app(payload: AppCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    app = App(
        tenant_id=tenant_id,
        name=payload.name,
        description=payload.description or ""
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

@router.delete("/{app_id}")
def delete_app(app_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    app = db.query(App).filter(App.id == app_id, App.tenant_id == tenant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="app_not_found")
    
    db.delete(app)
    db.commit()
    return {"ok": True}

