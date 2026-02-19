'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Bot,
  Users,
  Settings,
  MessageSquare,
  PinOff,
  Sprout,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { Conversation } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserMenu } from '@/components/auth/user-menu';

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const pinned: Conversation[] = [];
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const older: Conversation[] = [];

  for (const conv of conversations) {
    if (conv.isPinned) {
      pinned.push(conv);
      continue;
    }
    const updatedAt = new Date(conv.updatedAt);
    if (updatedAt >= todayStart) {
      today.push(conv);
    } else if (updatedAt >= yesterdayStart) {
      yesterday.push(conv);
    } else {
      older.push(conv);
    }
  }

  return { pinned, today, yesterday, older };
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  agentEmoji?: string;
  agentColor?: string;
  onClick: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  agentEmoji,
  agentColor,
  onClick,
  onTogglePin,
  onDelete,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 cursor-pointer',
          isActive
            ? 'bg-muted/80 text-foreground'
            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
        )}
        aria-label={`Open conversation: ${conversation.title}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeConversation"
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: agentColor || '#f97316' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        {/* Agent emoji */}
        <span className="shrink-0 text-base">{agentEmoji || '🤖'}</span>

        {/* Title and time */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="truncate text-sm font-medium">
            {truncate(conversation.title, 28)}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {formatRelativeTime(conversation.updatedAt)}
          </span>
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              className="flex shrink-0 items-center gap-0.5"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin();
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label={conversation.isPinned ? 'Unpin' : 'Pin'}
                    >
                      {conversation.isPinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {conversation.isPinned ? 'Unpin' : 'Pin'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pin indicator when not hovered */}
        {conversation.isPinned && !isHovered && (
          <Pin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
        )}
      </div>
    </motion.div>
  );
}

interface ConversationGroupProps {
  label: string;
  conversations: Conversation[];
  activeId: string | null;
  getAgent: (id: string) => { emoji: string; color: string } | undefined;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

function ConversationGroup({
  label,
  conversations,
  activeId,
  getAgent,
  onSelect,
  onTogglePin,
  onDelete,
}: ConversationGroupProps) {
  if (conversations.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      <AnimatePresence mode="popLayout">
        {conversations.map((conv) => {
          const agent = getAgent(conv.agentId);
          return (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              agentEmoji={agent?.emoji}
              agentColor={agent?.color}
              onClick={() => onSelect(conv.id)}
              onTogglePin={() => onTogglePin(conv.id)}
              onDelete={() => onDelete(conv.id)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ChatSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const togglePin = useChatStore((s) => s.togglePin);

  const agents = useAgentStore((s) => s.agents);
  const getAgentRaw = useAgentStore((s) => s.getAgent);

  const getAgent = (id: string) => {
    const a = getAgentRaw(id);
    return a ? { emoji: a.emoji, color: a.color } : undefined;
  };

  // Filter and sort conversations
  const sortedConversations = useMemo(() => {
    let filtered = conversations;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = conversations.filter((c) =>
        c.title.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, searchQuery]);

  const groups = useMemo(
    () => groupConversations(sortedConversations),
    [sortedConversations]
  );

  const handleNewChat = () => {
    const defaultAgent = agents[0];
    if (defaultAgent) {
      createConversation(defaultAgent.id);
    }
    // Navigate to chat if not already there
    if (pathname !== '/chat' && pathname !== '/') {
      router.push('/chat');
    }
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    if (pathname !== '/chat' && pathname !== '/') {
      router.push('/chat');
    }
  };

  const navItems = [
    { icon: Bot, label: 'Agents', href: '/agents' },
    { icon: Users, label: 'Families', href: '/families' },
    { icon: Sprout, label: 'Genesis', href: '/genesis' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="flex h-full w-72 flex-col border-r border-border/50 bg-sidebar">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦊</span>
          <h1 className="text-base font-bold text-foreground tracking-tight">
            La Famille
          </h1>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleNewChat}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                aria-label="New chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/30 border-border/30 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50"
            aria-label="Search conversations"
          />
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2 py-2">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-xs text-muted-foreground/40">
                Start a new chat to begin
              </p>
            )}
          </div>
        ) : (
          <>
            <ConversationGroup
              label="Pinned"
              conversations={groups.pinned}
              activeId={activeConversationId}
              getAgent={getAgent}
              onSelect={handleSelect}
              onTogglePin={togglePin}
              onDelete={deleteConversation}
            />
            <ConversationGroup
              label="Today"
              conversations={groups.today}
              activeId={activeConversationId}
              getAgent={getAgent}
              onSelect={handleSelect}
              onTogglePin={togglePin}
              onDelete={deleteConversation}
            />
            <ConversationGroup
              label="Yesterday"
              conversations={groups.yesterday}
              activeId={activeConversationId}
              getAgent={getAgent}
              onSelect={handleSelect}
              onTogglePin={togglePin}
              onDelete={deleteConversation}
            />
            <ConversationGroup
              label="Older"
              conversations={groups.older}
              activeId={activeConversationId}
              getAgent={getAgent}
              onSelect={handleSelect}
              onTogglePin={togglePin}
              onDelete={deleteConversation}
            />
          </>
        )}
      </ScrollArea>

      <Separator className="opacity-50" />

      {/* Bottom nav */}
      <div className="shrink-0 px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
              pathname === item.href
                ? 'bg-muted/60 text-foreground'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            )}
            aria-label={item.label}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}

        <Separator className="my-1.5 opacity-50" />
        <UserMenu />

        <div className="mt-1 flex items-center justify-between px-3 py-1">
          <span className="text-[10px] text-muted-foreground/40">
            v0.1.0
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
