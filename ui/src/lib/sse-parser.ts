export interface SSEChunk {
  content?: string;
  finishReason?: string;
}

/**
 * Parse an SSE stream from an OpenAI-compatible chat completion endpoint.
 *
 * Handles:
 * - Standard SSE "data: " lines with JSON payloads
 * - The "[DONE]" sentinel that signals end of stream
 * - Partial chunks that arrive split across ReadableStream reads
 * - Empty lines (SSE event separators)
 * - Connection errors mid-stream
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<SSEChunk> {
  const body = response.body;
  if (!body) {
    throw new Error('Response body is null -- cannot parse SSE stream');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');

  // Buffer for incomplete lines that span chunk boundaries
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining data in the buffer
        if (buffer.trim().length > 0) {
          const chunk = processLine(buffer);
          if (chunk) {
            yield chunk;
          }
        }
        break;
      }

      // Decode the binary chunk and append to our buffer
      buffer += decoder.decode(value, { stream: true });

      // Split on newlines -- SSE uses \n, \r\n, or \r as line terminators
      const lines = buffer.split(/\r?\n|\r/);

      // The last element may be an incomplete line, keep it in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const chunk = processLine(line);
        if (chunk === null) {
          // [DONE] sentinel -- stream is complete
          return;
        }
        if (chunk) {
          yield chunk;
        }
      }
    }
  } catch (error) {
    // If the stream was aborted, surface it cleanly
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Process a single SSE line.
 *
 * Returns:
 * - An SSEChunk if the line contains usable data
 * - undefined if the line should be skipped (empty, comment, non-data)
 * - null if the stream is done ([DONE] sentinel)
 */
function processLine(line: string): SSEChunk | undefined | null {
  const trimmed = line.trim();

  // Empty lines are SSE event separators -- skip
  if (trimmed === '') {
    return undefined;
  }

  // SSE comments start with ':' -- skip
  if (trimmed.startsWith(':')) {
    return undefined;
  }

  // We only care about data lines
  if (!trimmed.startsWith('data:')) {
    return undefined;
  }

  // Extract the payload after "data:"
  const payload = trimmed.slice(5).trim();

  // Check for the [DONE] sentinel
  if (payload === '[DONE]') {
    return null;
  }

  // Empty data payload -- skip
  if (payload === '') {
    return undefined;
  }

  try {
    const parsed = JSON.parse(payload);

    const choice = parsed.choices?.[0];
    if (!choice) {
      return undefined;
    }

    const result: SSEChunk = {};

    // Streaming responses use "delta" instead of "message"
    const delta = choice.delta;
    if (delta?.content) {
      result.content = delta.content;
    }

    if (choice.finish_reason) {
      result.finishReason = choice.finish_reason;
    }

    // Only yield if there is something meaningful
    if (result.content !== undefined || result.finishReason !== undefined) {
      return result;
    }

    return undefined;
  } catch {
    // Malformed JSON -- skip this line rather than crashing the stream
    return undefined;
  }
}
