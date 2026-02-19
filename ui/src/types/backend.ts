export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface APIBackend {
  id: string;
  name: string;
  baseUrl: string;
  authToken?: string;
  isDefault: boolean;
  models: string[];
  healthStatus: HealthStatus;
  timeoutMs: number;
}
