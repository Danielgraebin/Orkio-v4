# 🚀 Quick Start - ORKIO v4 User Console

**Última atualização:** 19 Nov 2025 14:15 GMT-3

---

## ⚡ Start Rápido (5 minutos)

### 1. Verificar Status
```bash
cd /home/ubuntu/orkio
cat STATUS.md
```

### 2. Iniciar Serviços (se não estiverem rodando)
```bash
# Backend
cd /home/ubuntu/orkio/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &

# Frontend
cd /home/ubuntu/orkio/web
pnpm dev &
```

### 3. Acessar User Console
```
https://3000-ia96ib8le53ob5nncbjwz-fa72d872.manusvm.computer/u/v4/chat
```

### 4. Login
- Email: dangraebin@gmail.com
- Senha: Patro@2025

### 5. Testar Modal de Agentes
1. Clique em "Nova Conversa"
2. Escolha um agente (ex: CFO)
3. Conversa criada com sucesso! ✅

---

## 📋 Comandos Úteis

### Verificar Serviços
```bash
ps aux | grep -E "uvicorn|next dev" | grep -v grep
```

### Testar Backend
```bash
curl http://localhost:8001/api/v1/u/agents \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Ver Logs
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/nextjs.log
```

### Backup
```bash
ls -lh /home/ubuntu/orkio_backup_*.tar.gz
```

---

## 📚 Documentação

- **Status:** `STATUS.md`
- **Resumo:** `SESSION_SUMMARY.md`
- **Próximas Fases:** `NEXT_PHASES_CHECKLIST.md`
- **Índice:** `DOCS_INDEX.md`

---

## 🎯 Próximas Fases

1. **Fase 1:** Upload de Arquivos (30-45 min)
2. **Fase 2:** Melhorar UX Texto (20-30 min) ← Recomendada
3. **Fase 3:** Observabilidade (45-60 min)
4. **Fase 4:** Validar RAG (30-45 min)
5. **Fase 5:** Teste Final (30 min)

---

## ❓ Problemas Comuns

### Backend não inicia
```bash
cd /home/ubuntu/orkio/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend não inicia
```bash
cd /home/ubuntu/orkio/web
pnpm install
```

### Erro de CORS
- Verificar se está usando URL relativa (`/api/v1/...`)
- Não usar `http://localhost:8001` no frontend

### Token expirado
- Fazer logout e login novamente
- Token tem validade de 24h

---

## ✅ Checklist de Validação

- [ ] Backend rodando na porta 8001
- [ ] Frontend rodando na porta 3000
- [ ] Login funciona
- [ ] Modal de agentes abre
- [ ] Conversa é criada com agente
- [ ] Nome do agente aparece no histórico

---

**Tudo funcionando?** Escolha a próxima fase em `NEXT_PHASES_CHECKLIST.md`! 🚀
