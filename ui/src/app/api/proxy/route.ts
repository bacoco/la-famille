import { NextRequest } from 'next/server';

/**
 * Proxy POST requests to the configured backend API.
 * The client sends: POST /api/proxy with headers:
 *   X-Backend-Url: <base url, e.g. http://100.123.165.124:51586/v1>
 *   X-Backend-Token: <auth token> (optional)
 *   X-Backend-Endpoint: <path after /v1, e.g. /chat/completions>
 *
 * This avoids CORS issues since the browser only talks to our Next.js server.
 */
export async function POST(request: NextRequest) {
  const backendUrl = request.headers.get('X-Backend-Url');
  const backendToken = request.headers.get('X-Backend-Token');
  const endpoint = request.headers.get('X-Backend-Endpoint') || '/chat/completions';

  if (!backendUrl) {
    return new Response(JSON.stringify({ error: 'Missing X-Backend-Url header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUrl = `${backendUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (backendToken) {
    headers['Authorization'] = `Bearer ${backendToken}`;
  }

  const body = await request.text();

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    // For streaming responses, pipe through directly
    if (upstream.body && upstream.headers.get('content-type')?.includes('text/event-stream')) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming: forward the JSON response
    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Proxy GET requests (for /models, /health, etc.)
 */
export async function GET(request: NextRequest) {
  const backendUrl = request.headers.get('X-Backend-Url');
  const backendToken = request.headers.get('X-Backend-Token');
  const endpoint = request.headers.get('X-Backend-Endpoint') || '/models';

  if (!backendUrl) {
    return new Response(JSON.stringify({ error: 'Missing X-Backend-Url header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUrl = `${backendUrl}${endpoint}`;
  const headers: Record<string, string> = {};
  if (backendToken) {
    headers['Authorization'] = `Bearer ${backendToken}`;
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
