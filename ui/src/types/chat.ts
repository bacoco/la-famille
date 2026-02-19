export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}
