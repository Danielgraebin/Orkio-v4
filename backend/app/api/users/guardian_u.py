from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.core.security import get_current_user_tenant
import io

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/export")
def export_guardian_csv(db: Session = Depends(get_db), tenant_id: int = Depends(get_current_user_tenant)):
    """Exporta CSV de auditoria do tenant"""
    csv_content = f"tenant_id,timestamp,event\n{tenant_id},2025-10-28,sample_event\n"
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=guardian_tenant_{tenant_id}.csv"}
    )

