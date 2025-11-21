# 🔗 ORKIO v4.0 - Guia de Integração com n8n

## 📋 Visão Geral

Este guia descreve como integrar o ORKIO v4.0 com n8n para automação avançada de workflows, processamento de documentos e RAG externo.

---

## 🎯 Casos de Uso

### 1. **Processamento Assíncrono de Documentos**
- Upload de documento no ORKIO → Webhook para n8n → Processamento em background → Notificação de conclusão

### 2. **RAG Avançado**
- Query no chat → n8n busca em múltiplas fontes → Retorna contexto enriquecido → ORKIO gera resposta

### 3. **Automação de Campanhas**
- Evento no ORKIO → n8n dispara workflow → Integra com APIs externas → Retorna resultado

### 4. **QA Automatizado**
- Documento processado → n8n gera perguntas/respostas → Valida qualidade → Armazena no ORKIO

---

## 🔌 Endpoints Disponíveis

### 1. **Health Check**
```
GET /api/v1/webhooks/n8n/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "orkio-webhooks",
  "timestamp": "2024-11-21T12:00:00Z"
}
```

---

### 2. **Document Processed (n8n → ORKIO)**
```
POST /api/v1/webhooks/n8n/document-processed
```

**Headers:**
```
X-Webhook-Signature: <hmac-sha256-signature>
Content-Type: application/json
```

**Payload:**
```json
{
  "document_id": 123,
  "status": "completed",
  "chunks_count": 42,
  "processing_time": 5.2,
  "metadata": {
    "filename": "document.pdf",
    "pages": 10
  }
}
```

**Response:**
```json
{
  "status": "received",
  "timestamp": "2024-11-21T12:00:00Z",
  "document_id": 123
}
```

---

### 3. **RAG Query (n8n → ORKIO)**
```
POST /api/v1/webhooks/n8n/rag-query
```

**Headers:**
```
X-Webhook-Signature: <hmac-sha256-signature>
Content-Type: application/json
```

**Payload:**
```json
{
  "query": "O que é ORKIO?",
  "tenant_id": 1,
  "top_k": 3,
  "threshold": 0.6
}
```

**Response:**
```json
{
  "results": [
    {
      "content": "ORKIO é uma plataforma...",
      "score": 0.85,
      "document_id": 123,
      "filename": "orkio_manual.pdf"
    }
  ],
  "total": 3,
  "query": "O que é ORKIO?"
}
```

---

### 4. **Chat Message (n8n → ORKIO)**
```
POST /api/v1/webhooks/n8n/chat-message
```

**Headers:**
```
X-Webhook-Signature: <hmac-sha256-signature>
Content-Type: application/json
```

**Payload:**
```json
{
  "conversation_id": 456,
  "message": "Olá, como posso criar uma campanha?",
  "user_id": 1,
  "agent_id": 2
}
```

**Response:**
```json
{
  "response": "Para criar uma campanha...",
  "message_id": 789,
  "timestamp": "2024-11-21T12:00:00Z"
}
```

---

### 5. **Trigger Workflow (ORKIO → n8n)**
```
POST /api/v1/webhooks/n8n/trigger-workflow
```

**Headers:**
```
X-API-Key: <your-n8n-api-key>
Content-Type: application/json
```

**Payload:**
```json
{
  "workflow_name": "process_document",
  "data": {
    "document_id": 123,
    "tenant_id": 1
  }
}
```

**Response:**
```json
{
  "status": "triggered",
  "workflow_name": "process_document",
  "timestamp": "2024-11-21T12:00:00Z"
}
```

---

## 🔐 Autenticação

### 1. **Webhook Signature (n8n → ORKIO)**

Todos os webhooks recebidos do n8n devem incluir o header `X-Webhook-Signature` com HMAC-SHA256:

```python
import hmac
import hashlib

secret = "your_webhook_secret_here"
payload = '{"document_id": 123}'
signature = hmac.new(
    secret.encode(),
    payload.encode(),
    hashlib.sha256
).hexdigest()
```

**Configuração no n8n:**
1. No node "Webhook", adicione header:
   - Name: `X-Webhook-Signature`
   - Value: `{{$json.signature}}`

2. Use node "Code" antes do webhook para gerar signature:
```javascript
const crypto = require('crypto');
const secret = 'your_webhook_secret_here';
const payload = JSON.stringify($input.item.json);
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

return { signature };
```

### 2. **API Key (ORKIO → n8n)**

Para ORKIO disparar workflows no n8n, use API Key:

```bash
curl -X POST https://your-n8n-instance.com/webhook/orkio \
  -H "X-API-Key: your_n8n_api_key" \
  -H "Content-Type: application/json" \
  -d '{"workflow_name": "process_document", "data": {...}}'
```

---

## 🛠️ Configuração no n8n

### 1. **Criar Webhook Node**

1. Adicione node "Webhook"
2. Configure:
   - **Webhook URL**: `/webhook/orkio-document-processed`
   - **HTTP Method**: POST
   - **Response Mode**: Last Node
   - **Response Code**: 200

### 2. **Validar Signature**

Adicione node "Code" após webhook:

```javascript
const crypto = require('crypto');
const secret = 'your_webhook_secret_here';
const signature = $input.item.headers['x-webhook-signature'];
const payload = JSON.stringify($input.item.json);

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}

return $input.item.json;
```

### 3. **Processar Payload**

Adicione nodes para processar dados:
- **HTTP Request**: Buscar documento no ORKIO
- **Code**: Processar texto
- **OpenAI**: Gerar embeddings
- **HTTP Request**: Salvar no ORKIO

### 4. **Retornar Resposta**

Adicione node "Respond to Webhook":
```json
{
  "status": "received",
  "timestamp": "{{$now}}",
  "document_id": "{{$json.document_id}}"
}
```

---

## 📊 Workflows de Exemplo

### 1. **Processamento de Documento**

```
[Webhook: ORKIO Upload]
  ↓
[Validar Signature]
  ↓
[HTTP: Download Documento]
  ↓
[Code: Extrair Texto]
  ↓
[OpenAI: Gerar Embeddings]
  ↓
[HTTP: Salvar Chunks no ORKIO]
  ↓
[Webhook Response: Success]
```

### 2. **RAG Avançado**

```
[Webhook: RAG Query]
  ↓
[Validar Signature]
  ↓
[HTTP: Buscar no ORKIO]
  ↓
[HTTP: Buscar no Google]
  ↓
[HTTP: Buscar no Notion]
  ↓
[Code: Merge Results]
  ↓
[Webhook Response: Results]
```

### 3. **QA Automatizado**

```
[Webhook: Document Processed]
  ↓
[OpenAI: Gerar Perguntas]
  ↓
[Loop: Para cada pergunta]
    ↓
    [HTTP: RAG Query no ORKIO]
    ↓
    [OpenAI: Gerar Resposta]
    ↓
    [Code: Validar Qualidade]
  ↓
[HTTP: Salvar QA no ORKIO]
  ↓
[Webhook Response: QA Complete]
```

---

## 🔧 Variáveis de Ambiente

Adicione ao Railway (Backend):

```bash
# Webhook Secret (gere um aleatório)
WEBHOOK_SECRET=your_very_secure_random_webhook_secret_here

# n8n API Key (para ORKIO disparar workflows)
N8N_API_KEY=your_n8n_api_key_here

# n8n Webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
```

---

## 🧪 Testar Integração

### 1. **Testar Health Check**

```bash
curl https://your-backend.railway.app/api/v1/webhooks/n8n/health
```

### 2. **Testar Webhook (sem signature)**

```bash
curl -X POST https://your-backend.railway.app/api/v1/webhooks/n8n/document-processed \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 123,
    "status": "completed",
    "chunks_count": 42
  }'
```

### 3. **Testar Webhook (com signature)**

```bash
# Gerar signature
PAYLOAD='{"document_id":123,"status":"completed"}'
SECRET="your_webhook_secret_here"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Enviar request
curl -X POST https://your-backend.railway.app/api/v1/webhooks/n8n/document-processed \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## 📚 Recursos Adicionais

- **n8n Docs**: https://docs.n8n.io
- **Webhook Security**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **ORKIO API Docs**: https://your-backend.railway.app/docs

---

## 🆘 Troubleshooting

### Erro: "Invalid webhook signature"
- Verifique se o secret está correto em ambos os lados
- Verifique se o payload está sendo serializado corretamente
- Use `console.log` no n8n para debugar signature

### Erro: "Invalid API key"
- Verifique se N8N_API_KEY está configurado no Railway
- Verifique se o header `X-API-Key` está sendo enviado

### Webhook não responde
- Verifique logs no Railway (Backend → Deployments → View Logs)
- Verifique se o endpoint está registrado (`/docs`)
- Teste com curl primeiro

---

**Integração n8n preparada!** 🚀

Próximos passos:
1. Configurar variáveis de ambiente no Railway
2. Criar workflows no n8n
3. Testar integração end-to-end

