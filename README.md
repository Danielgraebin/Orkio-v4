# ORKIO v4.0

Plataforma inteligente de automação e otimização de campanhas publicitárias, integrada ao ecossistema da Patroai.

## 🚀 Features

- ✅ **Admin Console**: Gerenciamento de usuários, agentes e configurações
- ✅ **User Console**: Interface de chat com agentes IA
- ✅ **RAG (Retrieval-Augmented Generation)**: Busca semântica em documentos
- ✅ **Upload de Documentos**: Suporte para PDF, TXT, DOCX, JSON, CSV, XLSX
- ✅ **Multi-LLM**: Suporte para OpenAI, Anthropic, Google, Groq
- ✅ **Autenticação**: Login/logout com JWT
- ✅ **Aprovação de Usuários**: Workflow de aprovação de novos usuários

## 📦 Stack

**Backend:**
- FastAPI (Python 3.11)
- PostgreSQL + pgvector
- SQLAlchemy
- OpenAI API (embeddings)

**Frontend:**
- Next.js 14
- TypeScript
- Tailwind CSS
- React

## 🔧 Setup Local

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd web
pnpm install
pnpm dev
```

### Database

```bash
docker-compose up -d
```

## 🌐 URLs

- **Admin Console**: `/admin/v4`
- **User Console**: `/u/v4/chat`
- **API Docs**: `/docs`

## 📄 License

Proprietary - PatroAI © 2024
