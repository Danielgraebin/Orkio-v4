# 🚀 ORKIO v4.0 - Guia de Deploy no Render.com

## 📋 Por que Render?

- ✅ **Free tier generoso** (750h/mês)
- ✅ **PostgreSQL gratuito** (90 dias, depois $7/mês)
- ✅ **Deploy automático** via GitHub
- ✅ **SSL gratuito** (HTTPS)
- ✅ **Logs em tempo real**
- ✅ **Mais estável** que sandbox

---

## 🎯 Passo a Passo Completo

### 1. **Login no Render**

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Login com **Google** (dangraebin@gmail.com)
4. Autorize acesso

### 2. **Conectar GitHub**

1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Clique em **"Connect GitHub"**
4. Autorize Render a acessar seus repositórios
5. Selecione: **Danielgraebin/Orkio-v4**

---

## 🗄️ PARTE 1: Criar PostgreSQL

### 1. **Criar Database**

1. No dashboard, clique em **"New +"**
2. Selecione **"PostgreSQL"**
3. Configure:
   - **Name**: `orkio-postgres`
   - **Database**: `orkio`
   - **User**: `orkio` (automático)
   - **Region**: `Oregon (US West)` ou mais próximo
   - **Plan**: **Free** (90 dias gratuitos)
4. Clique em **"Create Database"**

### 2. **Aguardar Criação** (2-3 minutos)

Aguarde status mudar para **"Available"**

### 3. **Instalar pgvector**

1. No database, vá em **"Connect"** → **"PSQL Command"**
2. Copie o comando (ex: `PGPASSWORD=... psql -h ...`)
3. Abra terminal local e execute
4. No psql, execute:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

**OU** use o Render Shell (mais fácil):
1. No database, clique em **"Connect"** → **"External Connection"**
2. Copie **Internal Database URL**
3. Guarde para usar nas variáveis de ambiente

---

## 🔧 PARTE 2: Deploy do Backend

### 1. **Criar Web Service (Backend)**

1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte ao repositório: **Orkio-v4**
4. Configure:

**Basic:**
- **Name**: `orkio-backend`
- **Region**: `Oregon (US West)` (mesmo do database)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Advanced:**
- **Plan**: **Free** (750h/mês)
- **Auto-Deploy**: ✅ **Yes** (deploy automático no push)

### 2. **Adicionar Variáveis de Ambiente**

Clique em **"Environment"** e adicione:

```bash
# Database (copie do PostgreSQL criado)
DATABASE_URL=postgresql://orkio:senha@host/orkio

# OpenAI (OBRIGATÓRIO - você precisa fornecer)
OPENAI_API_KEY=sk-proj-...

# JWT Secret (gere um aleatório seguro)
SECRET_KEY=seu_secret_key_muito_seguro_e_aleatorio_aqui

# Webhook Secret (para n8n)
WEBHOOK_SECRET=seu_webhook_secret_muito_seguro_aqui

# API Config
API_V1_STR=/api/v1
JWT_ALGORITHM=HS256

# CORS (atualize depois com URL do frontend)
CORS_ORIGINS=http://localhost:3000,https://orkio-frontend.onrender.com

# Optional: Outros LLMs
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...

# App Config
ENVIRONMENT=production
DEBUG=false
```

**Como pegar DATABASE_URL:**
1. Vá no PostgreSQL criado
2. Clique em **"Connect"** → **"Internal Database URL"**
3. Copie e cole em `DATABASE_URL`

### 3. **Deploy**

1. Clique em **"Create Web Service"**
2. Aguarde build (5-10 minutos)
3. Acompanhe logs em **"Logs"**
4. Aguarde status **"Live"**

### 4. **Pegar URL do Backend**

1. No serviço backend, copie a URL (ex: `https://orkio-backend.onrender.com`)
2. Teste: `https://orkio-backend.onrender.com/api/v1/health`
3. Deve retornar: `{"ok": true}`

---

## 🎨 PARTE 3: Deploy do Frontend

### 1. **Criar Web Service (Frontend)**

1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte ao repositório: **Orkio-v4** (mesmo repo)
4. Configure:

**Basic:**
- **Name**: `orkio-frontend`
- **Region**: `Oregon (US West)` (mesmo do backend)
- **Branch**: `main`
- **Root Directory**: `web`
- **Runtime**: `Node`
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`

**Advanced:**
- **Plan**: **Free** (750h/mês)
- **Auto-Deploy**: ✅ **Yes**

### 2. **Adicionar Variáveis de Ambiente**

Clique em **"Environment"** e adicione:

```bash
# Backend URL (use a URL do backend criado)
NEXT_PUBLIC_API_URL=https://orkio-backend.onrender.com/api/v1

# Node Config
NODE_ENV=production
```

### 3. **Deploy**

1. Clique em **"Create Web Service"**
2. Aguarde build (5-10 minutos)
3. Acompanhe logs em **"Logs"**
4. Aguarde status **"Live"**

### 4. **Pegar URL do Frontend**

1. No serviço frontend, copie a URL (ex: `https://orkio-frontend.onrender.com`)
2. Teste: `https://orkio-frontend.onrender.com`
3. Deve abrir a página de login

---

## 🔄 PARTE 4: Atualizar CORS

### 1. **Adicionar URL do Frontend no CORS**

1. Volte no serviço **backend**
2. Vá em **"Environment"**
3. Edite `CORS_ORIGINS`:
```bash
CORS_ORIGINS=http://localhost:3000,https://orkio-frontend.onrender.com
```
4. Clique em **"Save Changes"**
5. Backend vai fazer redeploy automático (1-2 min)

---

## 👤 PARTE 5: Criar Usuário Inicial

### 1. **Via API**

```bash
curl -X POST https://orkio-backend.onrender.com/api/v1/u/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dangraebin@gmail.com",
    "password": "senha123",
    "full_name": "Daniel Graebin"
  }'
```

### 2. **Ou via Render Shell**

1. No serviço backend, clique em **"Shell"**
2. Execute:
```bash
python -c "
from app.db.database import SessionLocal
from app.models.models import User, Tenant, Membership
from app.core.security import get_password_hash

db = SessionLocal()

# Criar tenant
tenant = Tenant(name='PATRO')
db.add(tenant)
db.commit()
db.refresh(tenant)

# Criar usuário
user = User(
    email='dangraebin@gmail.com',
    hashed_password=get_password_hash('senha123')
)
db.add(user)
db.commit()
db.refresh(user)

# Criar membership
membership = Membership(
    user_id=user.id,
    tenant_id=tenant.id,
    role='OWNER'
)
db.add(membership)
db.commit()

print('Usuário criado com sucesso!')
"
```

---

## 🧪 PARTE 6: Testar Tudo

### 1. **Backend**

```bash
# Health check
curl https://orkio-backend.onrender.com/api/v1/health

# Docs
open https://orkio-backend.onrender.com/docs

# Webhooks health
curl https://orkio-backend.onrender.com/api/v1/webhooks/n8n/health
```

### 2. **Frontend**

- **Login**: https://orkio-frontend.onrender.com/auth/login
- **Admin Console**: https://orkio-frontend.onrender.com/admin/v4
- **User Console**: https://orkio-frontend.onrender.com/u/v4/chat

### 3. **Testar Login**

1. Acesse: https://orkio-frontend.onrender.com/auth/login
2. Email: `dangraebin@gmail.com`
3. Senha: `senha123`
4. Deve redirecionar para `/u/v4/chat`

### 4. **Testar Upload**

1. No chat, clique no 📎 (clip)
2. Selecione um arquivo (PDF, TXT, DOCX)
3. Envie mensagem
4. Arquivo deve aparecer como anexo

### 5. **Testar RAG**

1. Faça upload de um documento
2. Aguarde processamento
3. Pergunte algo relacionado ao documento
4. Deve retornar resposta baseada no conteúdo

---

## 📊 Resumo das URLs

Após deploy completo, você terá:

| Serviço | URL | Status |
|---------|-----|--------|
| Backend | https://orkio-backend.onrender.com | ✅ |
| Frontend | https://orkio-frontend.onrender.com | ✅ |
| PostgreSQL | Internal URL (não público) | ✅ |
| API Docs | https://orkio-backend.onrender.com/docs | ✅ |
| Admin Console | https://orkio-frontend.onrender.com/admin/v4 | ✅ |
| User Console | https://orkio-frontend.onrender.com/u/v4/chat | ✅ |
| Webhooks | https://orkio-backend.onrender.com/api/v1/webhooks/n8n/* | ✅ |

---

## 💰 Custos

### Free Tier:
- **Web Services**: 750h/mês cada (suficiente para 1 serviço 24/7)
- **PostgreSQL**: Gratuito por 90 dias, depois $7/mês
- **Bandwidth**: 100GB/mês
- **Build Minutes**: Ilimitado

### Após Free Tier:
- **Starter Plan**: $7/mês por serviço
- **PostgreSQL**: $7/mês

**Total estimado:** $0/mês (primeiros 90 dias) → $21/mês (backend + frontend + postgres)

---

## 🔄 Auto-Deploy

Render faz deploy automático quando você faz push no GitHub:

```bash
git add .
git commit -m "feat: nova feature"
git push origin main
```

Render detecta e faz redeploy automaticamente! 🚀

---

## 🆘 Troubleshooting

### Backend não inicia:
- Verifique logs: Backend → Logs
- Verifique variáveis: Backend → Environment
- Verifique DATABASE_URL está correto

### Frontend não conecta ao backend:
- Verifique NEXT_PUBLIC_API_URL
- Verifique CORS_ORIGINS no backend
- Teste backend docs: /docs

### Database connection error:
- Verifique se pgvector está instalado
- Verifique DATABASE_URL
- Teste conexão via PSQL

### Build falha:
- Verifique logs de build
- Verifique requirements.txt (backend)
- Verifique package.json (frontend)

### Free tier esgotado:
- Render free tier: 750h/mês por serviço
- Para 2 serviços 24/7: precisa de 1440h/mês
- **Solução**: Upgrade para Starter ($7/mês cada)

---

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **ORKIO Issues**: https://github.com/Danielgraebin/Orkio-v4/issues

---

## ✅ Checklist Final

- [ ] PostgreSQL criado e disponível
- [ ] pgvector instalado
- [ ] Backend deployado e live
- [ ] Frontend deployado e live
- [ ] Variáveis de ambiente configuradas
- [ ] CORS atualizado com URL do frontend
- [ ] Usuário inicial criado
- [ ] Login funcionando
- [ ] Upload funcionando
- [ ] RAG funcionando
- [ ] Webhooks respondendo

---

**Deploy no Render completo!** 🎉

**Próximos passos:**
1. Testar todas as funcionalidades
2. Integrar com n8n (ver `N8N_INTEGRATION_GUIDE.md`)
3. Configurar domínio customizado (opcional)
4. Configurar monitoramento (opcional)

**Boa sorte!** 🚀

