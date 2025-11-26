from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings

# NullPool: sem pool, cria conexões sob demanda (ideal para Supabase free tier)
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,  # Sem pool - conexões sob demanda
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()



def get_db():
    """Dependency para obter sessão do banco"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

