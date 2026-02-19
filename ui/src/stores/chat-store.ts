import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation, Message } from '@/types/chat';
import { generateId } from '@/lib/utils';

const MAX_CONVERSATIONS = 100;

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;

  // Conversation CRUD
  createConversation: (agentId: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  getActiveConversation: () => Conversation | undefined;
  updateConversationTitle: (id: string, title: string) => void;
  togglePin: (id: string) => void;

  // Message operations
  addMessage: (
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  appendToMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;

  // Streaming helpers
  setMessageStreaming: (
    conversationId: string,
    messageId: string,
    streaming: boolean
  ) => void;

  // Bulk
  clearAllConversations: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: (agentId) => {
        const id = generateId('conv');
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id,
          title: 'New conversation',
          agentId,
          messages: [],
          createdAt: now,
          updatedAt: now,
          isPinned: false,
        };
        set((state) => {
          let convs = [conversation, ...state.conversations];
          // Evict oldest unpinned conversations if over the limit
          if (convs.length > MAX_CONVERSATIONS) {
            const pinned = convs.filter((c) => c.isPinned);
            const unpinned = convs.filter((c) => !c.isPinned);
            convs = [
              ...pinned,
              ...unpinned.slice(0, MAX_CONVERSATIONS - pinned.length),
            ];
          }
          return { conversations: convs, activeConversationId: id };
        });
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const convs = state.conversations.filter((c) => c.id !== id);
          const activeId =
            state.activeConversationId === id
              ? (convs[0]?.id ?? null)
              : state.activeConversationId;
          return { conversations: convs, activeConversationId: activeId };
        });
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, title, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        const messageId = generateId('msg');
        const fullMessage: Message = {
          ...message,
          id: messageId,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const updated: Conversation = {
              ...c,
              messages: [...c.messages, fullMessage],
              updatedAt: new Date().toISOString(),
            };
            // Auto-title from first user message
            if (c.title === 'New conversation' && message.role === 'user') {
              updated.title =
                message.content.slice(0, 50) +
                (message.content.length > 50 ? '\u2026' : '');
            }
            return updated;
          }),
        }));
        return messageId;
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
            };
          }),
        }));
      },

      appendToMessage: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, content: m.content + content }
                  : m
              ),
            };
          }),
        }));
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.filter((m) => m.id !== messageId),
            };
          }),
        }));
      },

      setMessageStreaming: (conversationId, messageId, streaming) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, isStreaming: streaming } : m
              ),
            };
          }),
        }));
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },
    }),
    {
      name: 'agentui-chats',
      // Strip streaming state before persisting to localStorage
      partialize: (state) => ({
        ...state,
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({ ...m, isStreaming: false })),
        })),
      }),
    }
  )
);
