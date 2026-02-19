export interface AgentSpec {
  _tempId: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  modelProvider: string;
  modelName: string;
  vibe: string;
}

export interface FamilyCreationRequest {
  name: string;
  displayName: string;
  emoji: string;
  description: string;
  agents: AgentSpec[];
  capabilities: string[];
  outputs: string[];
  schedule: Record<string, string>;
}

export interface PipelineLogEntry {
  timestamp: string;
  stage: 'validation' | 'architecte' | 'scribe' | 'forgeron';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export type PipelineStatus = 'idle' | 'running' | 'complete' | 'error';

export interface PipelineResult {
  familyDir?: string;
  port?: number;
  stages?: Array<{ stage: string; status: string; message?: string }>;
  error?: string;
}

export const MODEL_OPTIONS = [
  { provider: 'anthropic', models: ['claude-opus-4.6', 'claude-sonnet-4.5'] },
  { provider: 'openai', models: ['gpt-5.3-codex', 'gpt-4.1'] },
  { provider: 'google', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { provider: 'zai', models: ['glm-4.7', 'glm-4.5'] },
] as const;

export const CAPABILITY_OPTIONS = [
  'web-research',
  'web-scraping',
  'social-monitoring',
  'report-generation',
  'content-creation',
  'data-analysis',
  'competitive-analysis',
  'knowledge-base',
  'email-ingestion',
  'semantic-search',
  'auto-tagging',
  'summarization',
] as const;

export const OUTPUT_OPTIONS = [
  'html',
  'email',
  'pdf',
  'telegram',
  'json',
  'csv',
] as const;
