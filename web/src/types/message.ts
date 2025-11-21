export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  created_at: string;
}

