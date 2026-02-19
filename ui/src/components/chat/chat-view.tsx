'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { WelcomeScreen } from './welcome-screen';
import { AgentSelector } from './agent-selector';
import { cn } from '@/lib/utils';

export function ChatView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const createConversation = useChatStore((s) => s.createConversation);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = conversation?.messages || [];

  const agents = useAgentStore((s) => s.agents);
  const getAgent = useAgentStore((s) => s.getAgent);
  const agent = conversation ? getAgent(conversation.agentId) : agents[0];

  const { sendMessage, stopStreaming, isStreaming } = useChat();

  // Smart scroll: only auto-scroll if user is near the bottom
  const checkIfNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(
    (content: string) => {
      if (!agent) return;

      if (!activeConversationId) {
        const convId = createConversation(agent.id);
        setActiveConversation(convId);
        // Small delay so the store updates, then send
        setTimeout(() => sendMessage(content, agent.id), 50);
      } else {
        sendMessage(content, agent.id);
      }
    },
    [agent, activeConversationId, createConversation, setActiveConversation, sendMessage]
  );

  const handleRetry = useCallback(
    (messageIndex: number) => {
      if (!conversation) return;
      // Find the last user message before this assistant message
      const msgToRetry = conversation.messages[messageIndex];
      if (!msgToRetry || msgToRetry.role !== 'assistant') return;

      // Delete the assistant message
      deleteMessage(conversation.id, msgToRetry.id);

      // Find the preceding user message and resend
      const userMessages = conversation.messages
        .slice(0, messageIndex)
        .filter((m) => m.role === 'user');
      const lastUserMsg = userMessages[userMessages.length - 1];
      if (lastUserMsg) {
        sendMessage(lastUserMsg.content, conversation.agentId);
      }
    },
    [conversation, deleteMessage, sendMessage]
  );

  const handleAgentSelect = useCallback(
    (agentId: string) => {
      // Always create a new conversation with the selected agent
      const convId = createConversation(agentId);
      setActiveConversation(convId);
    },
    [createConversation, setActiveConversation]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Chat header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4">
        <div className="flex items-center gap-3">
          {agent && (
            <>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-base"
                style={{
                  backgroundColor: `${agent.color}20`,
                  border: `1px solid ${agent.color}40`,
                }}
              >
                {agent.emoji}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {agent.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 text-[10px] font-normal"
                  >
                    {agent.model}
                  </Badge>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block truncate max-w-[300px]">
                  {agent.description}
                </span>
              </div>
            </>
          )}
        </div>

        <AgentSelector
          currentAgentId={agent?.id}
          onSelect={handleAgentSelect}
        />
      </div>

      {/* Messages area */}
      {!hasMessages ? (
        <WelcomeScreen agent={agent} onSendSuggestion={handleSend} />
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={checkIfNearBottom}
        >
          <div className="mx-auto max-w-3xl py-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const messageAgent = message.agentId
                  ? getAgent(message.agentId)
                  : agent;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    agent={messageAgent}
                    onRetry={() => handleRetry(index)}
                    onDelete={() => {
                      if (conversation) {
                        deleteMessage(conversation.id, message.id);
                      }
                    }}
                  />
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} className="h-px" />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="mx-auto w-full max-w-3xl">
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          agent={agent}
        />
      </div>
    </div>
  );
}
