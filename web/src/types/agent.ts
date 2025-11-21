export interface Agent {
  id: number;
  name: string;
  system_prompt?: string | null;
  temperature: number;
}

