# 🚀 Guia de Deploy no Railway - ORKIO v4.0

## 📋 Pré-requisitos

- ✅ Repositório GitHub: https://github.com/Danielgraebin/Orkio-v4
- ✅ Conta Railway: https://railway.app (pode usar login com GitHub)

---

## 🎯 Passo a Passo

### 1. Criar Projeto no Railway

1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha: **Danielgraebin/Orkio-v4**

### 2. Adicionar PostgreSQL

1. No projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway vai criar automaticamente
4. Anote as credenciais (ou use variáveis de ambiente automáticas)

### 3. Configurar Backend

#### 3.1 Adicionar Serviço Backend

1. Clique em **"+ New"** → **"GitHub Repo"**
2. Selecione **Orkio-v4**
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 3.2 Variáveis de Ambiente (Backend)

Vá em **Settings** → **Variables** e adicione:

```bash
# Database (Railway fornece automaticamente se PostgreSQL estiver no mesmo projeto)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY=sk-proj-...

# JWT Secret (gere um aleatório)
SECRET_KEY=seu_secret_key_aqui_muito_seguro_e_aleatorio

# Opcional: Outros LLMs
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
```

#### 3.3 Instalar pgvector

1. No serviço PostgreSQL, vá em **"Data"** → **"Query"**
2. Execute:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Configurar Frontend

#### 4.1 Adicionar Serviço Frontend

1. Clique em **"+ New"** → **"GitHub Repo"**
2. Selecione **Orkio-v4**
3. Configure:
   - **Root Directory**: `web`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`

#### 4.2 Variáveis de Ambiente (Frontend)

```bash
# Backend URL (pegue da URL do serviço backend)
NEXT_PUBLIC_API_URL=https://orkio-backend-production.up.railway.app/api/v1
```

### 5. Configurar Domínios

#### Backend:
1. No serviço backend, vá em **Settings** → **Networking**
2. Clique em **"Generate Domain"**
3. Anote a URL (ex: `orkio-backend-production.up.railway.app`)

#### Frontend:
1. No serviço frontend, vá em **Settings** → **Networking**
2. Clique em **"Generate Domain"**
3. Anote a URL (ex: `orkio-frontend-production.up.railway.app`)

### 6. Rodar Migrações

1. No serviço backend, vá em **"Deployments"**
2. Clique nos 3 pontinhos → **"View Logs"**
3. Verifique se as migrações rodaram automaticamente
4. Se não, execute manualmente via Railway CLI ou adicione ao start command:
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 🧪 Testar Deploy

### Backend:
```bash
curl https://orkio-backend-production.up.railway.app/docs
```

### Frontend:
```
https://orkio-frontend-production.up.railway.app
```

### Admin Console:
```
https://orkio-frontend-production.up.railway.app/admin/v4
```

### User Console:
```
https://orkio-frontend-production.up.railway.app/u/v4/chat
```

---

## 🔐 Criar Usuário Inicial

1. Acesse o backend via Railway CLI ou logs
2. Execute:
```bash
python backend/seed_users.py
```

Ou via API:
```bash
curl -X POST https://orkio-backend-production.up.railway.app/api/v1/u/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dangraebin@gmail.com",
    "password": "senha123",
    "full_name": "Daniel Graebin"
  }'
```

---

## 📊 Monitoramento

- **Logs**: Railway → Serviço → Deployments → View Logs
- **Métricas**: Railway → Serviço → Metrics
- **Database**: Railway → PostgreSQL → Data

---

## 💰 Custos Estimados

- **Hobby Plan**: $5/mês (500h de runtime)
- **Pro Plan**: $20/mês (ilimitado)
- **PostgreSQL**: Incluído no plano

---

## 🆘 Troubleshooting

### Backend não inicia:
- Verifique variáveis de ambiente (DATABASE_URL, OPENAI_API_KEY)
- Verifique logs: Railway → Backend → Deployments → View Logs

### Frontend não conecta ao backend:
- Verifique NEXT_PUBLIC_API_URL
- Verifique CORS no backend

### Database connection error:
- Verifique se pgvector está instalado
- Verifique DATABASE_URL

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- ORKIO Issues: https://github.com/Danielgraebin/Orkio-v4/issues

---

**Após deploy, me envie:**
- ✅ URL do backend
- ✅ URL do frontend
- ✅ Credenciais de acesso ao Railway
- ✅ Credenciais do banco (se necessário)

