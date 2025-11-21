export interface StreamRequest {
  conversation_id: number;
  agent_id: number;
  message: string;
  use_rag?: boolean;
}

export interface StreamDelta {
  delta: string;
  done?: boolean;
}

