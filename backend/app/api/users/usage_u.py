from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import SessionLocal
from app.models.models import Usage
from app.core.security import get_current_user_tenant
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def get_usage(period: str | None = None, db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    """
    Retorna agregado de uso por métrica (OH/DP/MCC)
    period: YYYY-MM (opcional)
    """
    query = db.query(
        Usage.metric,
        func.sum(Usage.amount).label("total")
    )
    
    # Filtrar por tenant_id via user_id (simplificado)
    # TODO: adicionar tenant_id em Usage para filtro direto
    
    if period:
        try:
            year, month = period.split("-")
            start_date = datetime(int(year), int(month), 1)
            if int(month) == 12:
                end_date = datetime(int(year) + 1, 1, 1)
            else:
                end_date = datetime(int(year), int(month) + 1, 1)
            
            query = query.filter(
                Usage.created_at >= start_date,
                Usage.created_at < end_date
            )
        except:
            pass
    
    results = query.group_by(Usage.metric).all()
    
    return [
        {
            "metric": r.metric,
            "total": r.total
        }
        for r in results
    ]

