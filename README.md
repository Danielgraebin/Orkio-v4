# 🚀 ORKIO v4.0 - Plataforma de Chat com IA e RAG

> **Plataforma de chat inteligente** com suporte a múltiplos LLMs, RAG (Retrieval-Augmented Generation), upload de documentos e integração com n8n.

[![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

---

## ✨ Funcionalidades

### 🤖 Chat Inteligente
- Múltiplos LLMs: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), Google (Gemini), Groq
- Interface moderna e responsiva
- Histórico de conversas
- Markdown e code highlighting

### 📎 Upload de Documentos
- Suporte: PDF, TXT, DOCX
- Ícone discreto (18x18px)
- Processamento automático
- Download de anexos

### 🧠 RAG (Retrieval-Augmented Generation)
- Embeddings OpenAI (1536 dimensões)
- Busca vetorial com pgvector
- Chunking inteligente (500 caracteres)
- Respostas contextualizadas

### 🔗 Integração n8n
- 5 webhooks prontos
- Autenticação HMAC-SHA256
- RAG externo
- Automação de workflows

### 👥 Multi-tenant
- Isolamento de dados
- Roles: OWNER, ADMIN, MEMBER
- Gestão de equipes

---

## 🏗️ Arquitetura

```
orkio-v4/
├── backend/          # FastAPI + PostgreSQL + pgvector
│   ├── app/
│   │   ├── api/      # Endpoints REST
│   │   ├── models/   # SQLAlchemy models
│   │   ├── services/ # Lógica de negócio
│   │   └── core/     # Config, security, utils
│   ├── requirements.txt
│   └── init_db.py    # Script de inicialização
│
├── web/              # Next.js 14 + TypeScript
│   ├── app/          # App router
│   │   ├── auth/     # Login/logout
│   │   ├── admin/    # Console admin
│   │   └── u/        # Console usuário
│   ├── components/   # Componentes React
│   └── package.json
│
├── render.yaml       # Configuração Render (Blueprint)
├── .env.example      # Variáveis de ambiente
└── RENDER_DEPLOY_GUIDE.md  # Guia completo de deploy
```

---

## 🚀 Deploy no Render

### Opção 1: Blueprint (Automático)

1. Fork este repositório
2. Acesse: https://render.com
3. Login com Google
4. Clique em **"New +"** → **"Blueprint"**
5. Conecte ao repositório forkado
6. Configure variáveis de ambiente
7. Deploy automático! 🎉

### Opção 2: Manual (Passo a Passo)

Siga o guia completo: **[RENDER_DEPLOY_GUIDE.md](./RENDER_DEPLOY_GUIDE.md)**

**Resumo:**
1. Criar PostgreSQL com pgvector
2. Deploy do backend (FastAPI)
3. Deploy do frontend (Next.js)
4. Configurar variáveis de ambiente
5. Inicializar banco de dados
6. Testar funcionalidades

**Tempo estimado:** 20-30 minutos

---

## 🔧 Variáveis de Ambiente

### Backend

```bash
# Database (copie do Render PostgreSQL)
DATABASE_URL=postgresql://orkio:senha@host/orkio

# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY=sk-proj-...

# Secrets (gere com: python -c "import secrets; print(secrets.token_urlsafe(64))")
SECRET_KEY=seu_secret_key_aqui
WEBHOOK_SECRET=seu_webhook_secret_aqui

# API Config
API_V1_STR=/api/v1
JWT_ALGORITHM=HS256

# CORS (atualize com URL do frontend)
CORS_ORIGINS=https://orkio-frontend.onrender.com

# App Config
ENVIRONMENT=production
DEBUG=false
```

### Frontend

```bash
# Backend URL (atualize com URL do backend)
NEXT_PUBLIC_API_URL=https://orkio-backend.onrender.com/api/v1

# Node Config
NODE_ENV=production
```

Veja `.env.example` para mais detalhes.

---

## 🧪 Desenvolvimento Local

### Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Edite .env com suas credenciais
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd web
pnpm install
cp ../.env.example .env.local
# Edite .env.local com URL do backend
pnpm dev
```

### PostgreSQL Local

```bash
docker run -d \
  --name orkio-postgres \
  -e POSTGRES_DB=orkio \
  -e POSTGRES_USER=orkio \
  -e POSTGRES_PASSWORD=orkio \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

---

## 📊 Endpoints Principais

### Backend

| Endpoint | Descrição |
|----------|-----------|
| `/api/v1/health` | Health check |
| `/docs` | Documentação interativa (Swagger) |
| `/api/v1/u/auth/login` | Login |
| `/api/v1/u/auth/register` | Registro |
| `/api/v1/u/chats` | Gerenciar chats |
| `/api/v1/u/messages` | Enviar mensagens |
| `/api/v1/u/documents` | Upload de documentos |
| `/api/v1/webhooks/n8n/*` | Webhooks n8n |

### Frontend

| Rota | Descrição |
|------|-----------|
| `/auth/login` | Página de login |
| `/u/v4/chat` | Console do usuário |
| `/admin/v4` | Console admin |

---

## 🔗 Integração n8n

Veja o guia completo: **[N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)**

**Webhooks disponíveis:**
- `/api/v1/webhooks/n8n/health` - Health check
- `/api/v1/webhooks/n8n/rag/query` - Busca RAG
- `/api/v1/webhooks/n8n/rag/ingest` - Ingestão de documentos
- `/api/v1/webhooks/n8n/chat/process` - Processamento de mensagens
- `/api/v1/webhooks/n8n/qa/validate` - Validação de QA

**Autenticação:** HMAC-SHA256 com `WEBHOOK_SECRET`

---

## 💰 Custos Render

### Free Tier
- **Web Services**: 750h/mês cada
- **PostgreSQL**: Gratuito por 90 dias
- **Bandwidth**: 100GB/mês
- **Build Minutes**: Ilimitado

### Após Free Tier
- **Starter Plan**: $7/mês por serviço
- **PostgreSQL**: $7/mês

**Total:** $0/mês (primeiros 90 dias) → $21/mês (backend + frontend + postgres)

---

## 🆘 Troubleshooting

### Backend não inicia
- Verifique logs no Render
- Verifique `DATABASE_URL`
- Verifique `OPENAI_API_KEY`

### Frontend não conecta
- Verifique `NEXT_PUBLIC_API_URL`
- Verifique `CORS_ORIGINS` no backend
- Teste backend: `/docs`

### Database error
- Verifique se pgvector está instalado: `CREATE EXTENSION vector;`
- Teste conexão via PSQL

### Build falha
- Verifique `requirements.txt` (backend)
- Verifique `package.json` (frontend)
- Verifique logs de build

---

## 📚 Documentação

- **[RENDER_DEPLOY_GUIDE.md](./RENDER_DEPLOY_GUIDE.md)** - Guia completo de deploy
- **[N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)** - Integração com n8n
- **[ENTREGA_FINAL_ORKIO_V4.md](./ENTREGA_FINAL_ORKIO_V4.md)** - Resumo da entrega

---

## 🛠️ Stack Tecnológica

### Backend
- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 16 + pgvector
- **ORM**: SQLAlchemy 2.0+
- **Auth**: JWT (python-jose)
- **LLMs**: OpenAI, Anthropic, Google, Groq
- **Embeddings**: OpenAI text-embedding-3-small

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **HTTP**: Axios

### DevOps
- **Hosting**: Render.com
- **CI/CD**: GitHub Actions (auto-deploy)
- **Monitoring**: Render Logs
- **Database**: Render PostgreSQL

---

## 📄 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.

---

## 👤 Autor

**Daniel Graebin** ([@Danielgraebin](https://github.com/Danielgraebin))

**Desenvolvido por:** PatroAI

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📞 Suporte

- **Issues**: https://github.com/Danielgraebin/Orkio-v4/issues
- **Render Docs**: https://render.com/docs
- **Email**: dangraebin@gmail.com

---

**Deploy no Render e comece a usar!** 🚀

