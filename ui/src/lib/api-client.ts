import { APIBackend } from '@/types/backend';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export interface ChatCompletionRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Build headers that tell our proxy where to forward the request.
 */
function proxyHeaders(backend: APIBackend, endpoint: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Backend-Url': backend.baseUrl,
    'X-Backend-Endpoint': endpoint,
  };
  if (backend.authToken) {
    headers['X-Backend-Token'] = backend.authToken;
  }
  return headers;
}

/**
 * Send a non-streaming chat completion request.
 */
export async function chatCompletion(
  backend: APIBackend,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), backend.timeoutMs);

  try {
    const response = await fetch(`${BASE_PATH}/api/proxy`, {
      method: 'POST',
      headers: proxyHeaders(backend, '/chat/completions'),
      body: JSON.stringify({ ...request, stream: false }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Chat completion failed (${response.status}): ${errorBody || response.statusText}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Send a streaming chat completion request. Returns the raw Response so the
 * caller can pass it to parseSSEStream() for incremental consumption.
 */
export async function chatCompletionStream(
  backend: APIBackend,
  request: ChatCompletionRequest,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), backend.timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(`${BASE_PATH}/api/proxy`, {
      method: 'POST',
      headers: proxyHeaders(backend, '/chat/completions'),
      body: JSON.stringify({ ...request, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Streaming chat completion failed (${response.status}): ${errorBody || response.statusText}`
      );
    }

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Check the health of a backend by hitting its /health endpoint.
 */
export async function checkHealth(backend: APIBackend): Promise<boolean> {
  const baseWithoutVersion = backend.baseUrl.replace(/\/v1\/?$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${BASE_PATH}/api/proxy`, {
      method: 'GET',
      headers: {
        'X-Backend-Url': baseWithoutVersion,
        'X-Backend-Endpoint': '/health',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available models from a backend.
 */
export async function listModels(backend: APIBackend): Promise<string[]> {
  const headers: Record<string, string> = {
    'X-Backend-Url': backend.baseUrl,
    'X-Backend-Endpoint': '/models',
  };
  if (backend.authToken) {
    headers['X-Backend-Token'] = backend.authToken;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${BASE_PATH}/api/proxy`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data?.data && Array.isArray(data.data)) {
      return data.data.map((m: { id: string }) => m.id);
    }

    return [];
  } catch {
    return [];
  }
}
