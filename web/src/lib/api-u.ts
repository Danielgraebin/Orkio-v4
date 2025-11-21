import axios from "axios";

// Classe de erro para autenticação
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const apiU = axios.create({ 
  baseURL: "/api/v1/u" 
});

apiU.interceptors.request.use((config) => {
  const token = localStorage.getItem("orkio_u_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AGENTS =====
export async function getAgents() {
  const response = await apiU.get("/agents");
  return response.data.agents || response.data;
}

// ===== CONVERSATIONS =====
export async function getConversations() {
  const response = await apiU.get("/conversations");
  return response.data.conversations || response.data.items || response.data;
}

export async function createConversation(agentId: number) {
  const response = await apiU.post("/conversations", { agent_id: agentId });
  return response.data;
}

export async function getConversationMessages(conversationId: number) {
  const response = await apiU.get(`/conversations/${conversationId}/messages`);
  return response.data.messages || response.data.items || response.data;
}

export async function deleteConversation(conversationId: number) {
  const response = await apiU.delete(`/conversations/${conversationId}`);
  return response.data;
}

// ===== CHAT =====
export async function sendMessage(conversationId: number | null, agentId: number, message: string) {
  const response = await apiU.post("/chat", {
    conversation_id: conversationId,
    agent_id: agentId,
    message: message
  });
  return response.data;
}

export default apiU;



// ===== P0c: MENSAGENS ENTRE AGENTES =====
export async function sendAgentMessage(fromAgentId: number, toAgentId: number, message: string) {
  const response = await axios.post("/api/v1/admin/agent-send", {
    from_agent_id: fromAgentId,
    to_agent_id: toAgentId,
    message
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("orkio_u_token")}`
    }
  });
  return response.data;
}

// ===== P0c: RENOMEAR CONVERSA =====
export async function renameConversation(conversationId: number, title: string) {
  const response = await apiU.patch(`/conversations/${conversationId}`, { title });
  return response.data;
}

// ===== P0c: UPLOAD VIA CHAT =====
export async function uploadAttachment(conversationId: number, file: File, agentId: number) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("agent_id", agentId.toString());
  
  const response = await apiU.post(`/conversations/${conversationId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
}

// ===== P0c: PAINEL HIVE - RAG EVENTS =====
export async function getRAGEvents(conversationId?: number) {
  const params = conversationId ? `?conversation_id=${conversationId}` : "";
  const response = await axios.get(`/api/v1/admin/rag/events${params}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("orkio_u_token")}`
    }
  });
  // API retorna { events: [...] }, garantir que sempre seja array
  return Array.isArray(response.data.events) ? response.data.events : [];
}

// ===== P0c: PAINEL HIVE - AGENT DIALOGS =====
export async function getAgentDialogs(fromAgentId?: number, toAgentId?: number) {
  const params = new URLSearchParams();
  if (fromAgentId) params.append("from_agent_id", fromAgentId.toString());
  if (toAgentId) params.append("to_agent_id", toAgentId.toString());
  
  const response = await axios.get(`/api/v1/admin/agent-dialogs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("orkio_u_token")}`
    }
  });
  // API retorna { dialogs: [...] } ou array direto, garantir que sempre seja array
  return Array.isArray(response.data.dialogs) ? response.data.dialogs : (Array.isArray(response.data) ? response.data : []);
}

