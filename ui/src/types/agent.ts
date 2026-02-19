export interface AgentPersonality {
  vibe: string;
  role: string;
  limitations: string;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  creature: string;
  backendId: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  personality: AgentPersonality;
  isPreset: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentCreate = Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'isPreset'>;
