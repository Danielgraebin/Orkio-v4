from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import ApiKey
from app.core.security import get_current_user_tenant, hash_password
import secrets

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class KeyCreate(BaseModel):
    name: str
    app_id: int | None = None

def generate_api_key():
    """Gera chave no formato ork_xxxxxxxxxxxxx"""
    random_part = secrets.token_urlsafe(32)
    return f"ork_{random_part}"

@router.post("")
def create_key(payload: KeyCreate, db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    # Gerar plaintext key
    plaintext_key = generate_api_key()
    prefix = plaintext_key[:8]  # ork_xxxx
    
    # Salvar hash
    key = ApiKey(
        tenant_id=tenant_id,
        app_id=payload.app_id,
        prefix=prefix,
        key_hash=hash_password(plaintext_key),
        name=payload.name
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    
    # Retornar plaintext apenas uma vez
    return {
        "id": key.id,
        "prefix": prefix,
        "plaintext_key": plaintext_key,  # ÚNICA VEZ
        "name": key.name,
        "created_at": key.created_at
    }

@router.get("")
def list_keys(db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    keys = db.query(ApiKey).filter(
        ApiKey.tenant_id == tenant_id,
        ApiKey.revoked == False
    ).all()
    
    # Não retornar plaintext nem hash
    return [
        {
            "id": k.id,
            "prefix": k.prefix,
            "name": k.name,
            "app_id": k.app_id,
            "created_at": k.created_at
        }
        for k in keys
    ]

@router.delete("/{key_id}")
def revoke_key(key_id: int, db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.tenant_id == tenant_id
    ).first()
    
    if not key:
        raise HTTPException(status_code=404, detail="key_not_found")
    
    key.revoked = True
    db.commit()
    return {"ok": True}

