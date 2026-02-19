'use client';

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { useBackendStore } from '@/stores/backend-store';
import { chatCompletionStream } from '@/lib/api-client';
import { parseSSEStream } from '@/lib/sse-parser';

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);

  const {
    activeConversationId,
    getActiveConversation,
    createConversation,
    addMessage,
    appendToMessage,
    setMessageStreaming,
    updateMessage,
  } = useChatStore();

  const getAgent = useAgentStore((s) => s.getAgent);
  const getBackend = useBackendStore((s) => s.getBackend);
  const getDefaultBackend = useBackendStore((s) => s.getDefault);

  const sendMessage = useCallback(
    async (content: string, agentId?: string) => {
      let conversationId = activeConversationId;
      const conversation = getActiveConversation();

      const effectiveAgentId = agentId || conversation?.agentId;
      if (!effectiveAgentId) return;

      const agent = getAgent(effectiveAgentId);
      if (!agent) return;

      const backend = getBackend(agent.backendId) || getDefaultBackend();
      if (!backend) return;

      // Create conversation if needed
      if (!conversationId) {
        conversationId = createConversation(effectiveAgentId);
      }

      // Add user message
      addMessage(conversationId, { role: 'user', content });

      // Add empty assistant message (will be streamed into)
      const assistantMsgId = addMessage(conversationId, {
        role: 'assistant',
        content: '',
        agentId: effectiveAgentId,
        isStreaming: true,
      });

      // Build messages array for API call
      const conv = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);
      const apiMessages: { role: string; content: string }[] = [];

      // Include system prompt if the agent defines one
      if (agent.systemPrompt) {
        apiMessages.push({ role: 'system', content: agent.systemPrompt });
      }

      // Include conversation history (excluding the empty assistant placeholder)
      if (conv) {
        for (const msg of conv.messages) {
          if (msg.id === assistantMsgId) continue;
          if (msg.role === 'system') continue;
          apiMessages.push({ role: msg.role, content: msg.content });
        }
      }

      // Abort any previous in-flight request
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await chatCompletionStream(
          backend,
          {
            model: agent.model,
            messages: apiMessages,
            temperature: agent.temperature,
            max_tokens: agent.maxTokens,
            stream: true,
          },
          abortController.signal
        );

        for await (const chunk of parseSSEStream(response)) {
          if (abortController.signal.aborted) break;
          if (chunk.content) {
            appendToMessage(conversationId!, assistantMsgId, chunk.content);
          }
        }

        setMessageStreaming(conversationId!, assistantMsgId, false);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setMessageStreaming(conversationId!, assistantMsgId, false);
          return;
        }

        updateMessage(conversationId!, assistantMsgId, {
          content: `Error: ${(error as Error).message || 'Failed to get response'}`,
          isStreaming: false,
          isError: true,
        });
      } finally {
        if (abortRef.current === abortController) {
          abortRef.current = null;
        }
      }
    },
    [
      activeConversationId,
      getActiveConversation,
      createConversation,
      addMessage,
      appendToMessage,
      setMessageStreaming,
      updateMessage,
      getAgent,
      getBackend,
      getDefaultBackend,
    ]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const isStreaming = useChatStore((s) => {
    const conv = s.conversations.find(
      (c) => c.id === s.activeConversationId
    );
    return conv?.messages.some((m) => m.isStreaming) ?? false;
  });

  return { sendMessage, stopStreaming, isStreaming };
}
