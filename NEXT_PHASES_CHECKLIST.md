# 📋 Checklist - Próximas Fases do User Console

**Status Atual:** Modal de Agentes ✅ COMPLETO

---

## 📎 FASE 1: Upload de Arquivos (30-45 min)

### Backend
- [ ] Criar endpoint POST /api/v1/u/files
- [ ] Validar tipos de arquivo permitidos
- [ ] Salvar arquivo em storage (S3 ou local)
- [ ] Retornar file_id e URL
- [ ] Vincular arquivo à conversa
- [ ] Adicionar file_id ao payload do chat

### Frontend
- [ ] Adicionar input type="file" oculto
- [ ] Botão de anexo (📎) ao lado do textarea
- [ ] Preview de arquivos selecionados
- [ ] Indicador de upload em progresso
- [ ] Remover arquivo antes de enviar
- [ ] Exibir arquivos nas mensagens
- [ ] Download de arquivos anexados

### Testes
- [ ] Upload de PDF
- [ ] Upload de imagem
- [ ] Upload de documento (docx, xlsx)
- [ ] Múltiplos arquivos
- [ ] Validação de tamanho máximo
- [ ] Erro de upload

---

## ✍️ FASE 2: Melhorar UX da Caixa de Texto (20-30 min)

### Textarea Auto-grow
- [ ] Altura mínima: 2 linhas
- [ ] Altura máxima: 10 linhas
- [ ] Auto-expand conforme digita
- [ ] Scroll interno após limite

### Atalhos de Teclado
- [ ] Enter → Envia mensagem
- [ ] Shift+Enter → Nova linha
- [ ] Ctrl+Enter → Nova linha (alternativa)
- [ ] Desabilitar envio se vazio

### Visual Feedback
- [ ] Contador de caracteres (opcional)
- [ ] Indicador "Digitando..." (opcional)
- [ ] Placeholder dinâmico
- [ ] Focus state destacado

### Testes
- [ ] Enter envia mensagem
- [ ] Shift+Enter adiciona linha
- [ ] Textarea cresce até limite
- [ ] Scroll funciona após limite
- [ ] Placeholder desaparece ao digitar

---

## 👁️ FASE 3: Observabilidade (45-60 min)

### Handoffs de Agentes
- [ ] Backend retorna eventos de handoff
- [ ] Frontend exibe "Transferido para {agente}"
- [ ] Ícone diferenciado para handoffs
- [ ] Timeline de mudanças de agente

### RAG Observability
- [ ] Backend retorna quando RAG é acionado
- [ ] Exibir "Consultando documentos..."
- [ ] Listar documentos consultados
- [ ] Mostrar relevância/score
- [ ] Link para documento original

### Eventos do Sistema
- [ ] Início de conversa
- [ ] Mudança de agente
- [ ] Consulta RAG
- [ ] Erro de processamento
- [ ] Timeout de resposta

### UI Components
- [ ] Badge para eventos especiais
- [ ] Tooltip com detalhes
- [ ] Cor diferenciada por tipo
- [ ] Timestamp de cada evento

### Testes
- [ ] Handoff entre Daniel e CFO
- [ ] RAG consulta documentos
- [ ] Eventos aparecem no chat
- [ ] Timeline ordenada corretamente

---

## 🔍 FASE 4: Validar RAG (30-45 min)

### Preparação
- [ ] Verificar documentos no tenant
- [ ] Confirmar embeddings gerados
- [ ] Testar busca direta no backend

### Testes de Busca
- [ ] Pergunta sobre documento específico
- [ ] Pergunta genérica
- [ ] Pergunta sem resposta nos docs
- [ ] Múltiplos documentos relevantes

### Ajustes
- [ ] Threshold de relevância
- [ ] Número de documentos retornados
- [ ] Tamanho dos chunks
- [ ] Prompt de RAG

### Validação
- [ ] Respostas precisas
- [ ] Citações corretas
- [ ] Documentos relevantes
- [ ] Performance aceitável

---

## ✅ FASE 5: Teste Final (30 min)

### Fluxo Completo
- [ ] Login como USER
- [ ] Criar nova conversa
- [ ] Escolher agente
- [ ] Enviar mensagem de texto
- [ ] Anexar arquivo
- [ ] Enviar mensagem com arquivo
- [ ] Ver resposta do agente
- [ ] Observar handoff (se aplicável)
- [ ] Observar RAG (se aplicável)
- [ ] Trocar de conversa
- [ ] Criar segunda conversa
- [ ] Logout

### Validações
- [ ] Sem erros no console
- [ ] Performance aceitável
- [ ] UI responsiva
- [ ] Mobile-friendly
- [ ] Acessibilidade básica

### Documentação
- [ ] README atualizado
- [ ] Endpoints documentados
- [ ] Variáveis de ambiente
- [ ] Como rodar local
- [ ] Como fazer deploy

---

## 📊 ESTIMATIVAS DE TEMPO

| Fase | Tempo Estimado | Prioridade |
|------|----------------|------------|
| Fase 1: Upload | 30-45 min | Alta |
| Fase 2: UX Texto | 20-30 min | Alta |
| Fase 3: Observabilidade | 45-60 min | Média |
| Fase 4: Validar RAG | 30-45 min | Alta |
| Fase 5: Teste Final | 30 min | Alta |
| **TOTAL** | **2h35 - 3h30** | - |

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Fase 2** (UX Texto) - Rápido e melhora experiência imediata
2. **Fase 1** (Upload) - Funcionalidade core importante
3. **Fase 4** (Validar RAG) - Garantir que RAG funciona
4. **Fase 3** (Observabilidade) - Polimento final
5. **Fase 5** (Teste Final) - Validação completa

---

## 📝 NOTAS

- Todas as fases são independentes (podem ser feitas em qualquer ordem)
- Fase 3 depende de Fase 4 estar funcionando para testar RAG observability
- Fase 5 deve ser sempre a última
- Priorizar conforme necessidade do cliente

---

**Última atualização:** 19 Nov 2025 14:05 GMT-3

