export interface Conversation {
  id: number;
  agent_id: number;
  agent_name: string;
  title: string | null;
  created_at: string;
}

export interface CreateConversationRequest {
  agent_id: number;
  title?: string;
}

