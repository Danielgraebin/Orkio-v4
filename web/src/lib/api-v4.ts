/**
 * ORKIO v4.0 - API Client
 */
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Agent,
  Conversation,
  CreateConversationRequest,
  ChatMessage,
  StreamRequest,
  StreamDelta,
} from "@/types";

const API_BASE = "/api/v1/u";

// ===== AUTH =====

export async function login(req: AuthLoginRequest): Promise<AuthLoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

// ===== AGENTS =====

export async function getAgents(token: string): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

// ===== CONVERSATIONS =====

export async function getConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function createConversation(
  token: string,
  req: CreateConversationRequest
): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  const data = await res.json();
  return data;
}

export async function getConversationMessages(
  token: string,
  conversationId: number
): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

// ===== STREAMING SSE =====

export async function streamChat(
  token: string,
  payload: StreamRequest,
  onDelta: (chunk: string) => void,
  onDone: (ragSources?: any[]) => void,
  onError: (err: any) => void
) {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    onError(new Error("Failed to start streaming"));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n").filter((line) => line.trim().startsWith("data: "));

      for (const line of lines) {
        const jsonStr = line.replace("data: ", "").trim();
        try {
          const event: StreamDelta = JSON.parse(jsonStr);
          if (event.done) {
            onDone((event as any).rag_sources);
            return;
          }
          if (event.delta) {
            onDelta(event.delta);
          }
        } catch (err) {
          console.warn("Error parsing SSE:", err);
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}

