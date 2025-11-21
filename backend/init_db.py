"""
Script para inicializar o banco de dados no Render
Cria usuário inicial e configura tenant
"""
import sys
import os

# Adicionar path do app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine
from app.models.models import User, Tenant, Membership, Base
from app.core.security import get_password_hash

def init_database():
    """Inicializa o banco de dados"""
    print("🔧 Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas!")
    
    db = SessionLocal()
    try:
        # Verificar se já existe usuário
        existing_user = db.query(User).filter(User.email == "dangraebin@gmail.com").first()
        if existing_user:
            print("⚠️  Usuário dangraebin@gmail.com já existe!")
            return
        
        # Criar tenant
        print("🏢 Criando tenant PATRO...")
        tenant = Tenant(name="PATRO")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        print(f"✅ Tenant criado! ID: {tenant.id}")
        
        # Criar usuário
        print("👤 Criando usuário dangraebin@gmail.com...")
        user = User(
            email="dangraebin@gmail.com",
            hashed_password=get_password_hash("senha123"),
            full_name="Daniel Graebin"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Usuário criado! ID: {user.id}")
        
        # Criar membership
        print("🔗 Criando membership...")
        membership = Membership(
            user_id=user.id,
            tenant_id=tenant.id,
            role="OWNER"
        )
        db.add(membership)
        db.commit()
        print("✅ Membership criada!")
        
        print("\n🎉 Banco de dados inicializado com sucesso!")
        print("\n📋 Credenciais:")
        print("   Email: dangraebin@gmail.com")
        print("   Senha: senha123")
        print("\n⚠️  IMPORTANTE: Altere a senha após primeiro login!")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()

