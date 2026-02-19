'use client';

import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/components/agents/agent-avatar';
import type { Agent } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
  className?: string;
}

export function AgentCard({ agent, onClick, className }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all',
        'hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'cursor-pointer w-full',
        className
      )}
    >
      <div className="flex w-full items-start justify-between">
        <AgentAvatar emoji={agent.emoji} color={agent.color} size="lg" />
        {agent.isPreset && (
          <div className="flex items-center gap-1 text-primary/70">
            <Crown className="size-3.5" />
            <span className="text-xs">Preset</span>
          </div>
        )}
      </div>

      <div className="w-full space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground">{agent.name}</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {agent.model}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {agent.description}
        </p>

        {agent.personality.vibe && (
          <p className="text-xs italic text-muted-foreground/70 pt-1">
            {agent.personality.vibe}
          </p>
        )}
      </div>
    </button>
  );
}
