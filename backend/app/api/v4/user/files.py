"""
Rotas User v4 - File Upload
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime

from app.db.database import get_db
from app.models.models import Document, Conversation
from app.core.security import get_current_user_v4

router = APIRouter()

# Diretório para armazenar uploads
UPLOAD_DIR = "/home/ubuntu/orkio/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/files", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: Optional[int] = Form(None),
    current_user = Depends(get_current_user_v4),
    db: Session = Depends(get_db)
):
    """
    Upload de arquivo pelo usuário.
    
    - Recebe multipart/form-data
    - Valida token do usuário
    - Salva arquivo no disco
    - Vincula file_id à conversa (se conversation_id fornecido)
    - Retorna JSON com file_id, filename, url e status
    """
    try:
        # Validar tamanho do arquivo (max 50MB)
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        
        # Ler conteúdo do arquivo
        contents = await file.read()
        file_size = len(contents)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is 50MB, got {file_size / 1024 / 1024:.2f}MB"
            )
        
        # Gerar nome único para o arquivo
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Salvar arquivo no disco
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Criar registro no banco (usando modelo Document)
        # Nota: agent_id é obrigatório no modelo, usando primeiro agente do tenant
        from app.models.models import Agent
        first_agent = db.query(Agent).filter(
            Agent.tenant_id == current_user._tenant_id
        ).first()
        
        if not first_agent:
            raise HTTPException(
                status_code=500,
                detail="No agent found for tenant"
            )
        
        document = Document(
            tenant_id=current_user._tenant_id,
            agent_id=first_agent.id,
            filename=file.filename,
            storage_path=file_path,
            size_bytes=file_size,
            status="READY",
            tags=None
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Se conversation_id fornecido, validar que pertence ao usuário
        if conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.tenant_id == current_user._tenant_id
            ).first()
            
            if not conversation:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found or does not belong to tenant"
                )
            
            # TODO: Vincular documento à conversa (precisa criar tabela de relacionamento)
            # Por enquanto, apenas validamos que a conversa existe
        
        # Retornar resposta
        return {
            "file_id": document.id,
            "filename": file.filename,
            "url": f"/uploads/{unique_filename}",
            "status": "uploaded",
            "size_kb": round(file_size / 1024, 2),
            "created_at": document.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/files/{file_id}", response_class=FileResponse)
async def download_file(
    file_id: int,
    current_user = Depends(get_current_user_v4),
    db: Session = Depends(get_db)
):
    """
    Download de arquivo pelo usuário.
    
    - Valida que o arquivo pertence ao tenant do usuário
    - Retorna o arquivo para download
    """
    try:
        # Buscar documento no banco
        document = db.query(Document).filter(
            Document.id == file_id,
            Document.tenant_id == current_user._tenant_id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="File not found or access denied"
            )
        
        # Verificar se arquivo existe no disco
        if not os.path.exists(document.storage_path):
            raise HTTPException(
                status_code=404,
                detail="File not found on disk"
            )
        
        # Retornar arquivo
        return FileResponse(
            path=document.storage_path,
            filename=document.filename,
            media_type="application/octet-stream"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download file: {str(e)}"
        )

