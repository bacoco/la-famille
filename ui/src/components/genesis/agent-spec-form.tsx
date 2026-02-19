'use client';

import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AgentSpec } from '@/types/genesis';
import { MODEL_OPTIONS } from '@/types/genesis';

interface AgentSpecFormProps {
  agent: AgentSpec;
  index: number;
  totalCount: number;
  onChange: (updates: Partial<AgentSpec>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

export function AgentSpecForm({
  agent,
  index,
  totalCount,
  onChange,
  onRemove,
  onMove,
}: AgentSpecFormProps) {
  const providerModels =
    MODEL_OPTIONS.find((o) => o.provider === agent.modelProvider)?.models || [];

  const fieldPrefix = `agent-${agent._tempId}`;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            aria-label={`Move agent ${agent.name || index + 1} up`}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === totalCount - 1}
            aria-label={`Move agent ${agent.name || index + 1} down`}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>

        <span className="text-xl shrink-0">{agent.emoji || '🤖'}</span>
        <span className="text-sm font-medium flex-1 truncate">
          {agent.name || `Agent ${index + 1}`}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          #{index + 1}
        </span>
        <button
          onClick={onRemove}
          aria-label={`Remove agent ${agent.name || index + 1}`}
          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-[1fr_80px] gap-3">
        <div>
          <Label htmlFor={`${fieldPrefix}-name`} className="text-xs">Name (kebab-case)</Label>
          <Input
            id={`${fieldPrefix}-name`}
            value={agent.name}
            onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="veilleur-web"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${fieldPrefix}-emoji`} className="text-xs">Emoji</Label>
          <Input
            id={`${fieldPrefix}-emoji`}
            value={agent.emoji}
            onChange={(e) => onChange({ emoji: e.target.value })}
            placeholder="🕸️"
            maxLength={4}
            className="h-8 text-sm text-center"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${fieldPrefix}-role`} className="text-xs">Role</Label>
        <Input
          id={`${fieldPrefix}-role`}
          value={agent.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="researcher, analyst, reporter..."
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${fieldPrefix}-provider`} className="text-xs">Provider</Label>
          <Select
            value={agent.modelProvider}
            onValueChange={(v) => onChange({ modelProvider: v, modelName: '' })}
          >
            <SelectTrigger id={`${fieldPrefix}-provider`} className="h-8 text-sm">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((o) => (
                <SelectItem key={o.provider} value={o.provider}>
                  {o.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${fieldPrefix}-model`} className="text-xs">Model</Label>
          <Select
            value={agent.modelName}
            onValueChange={(v) => onChange({ modelName: v })}
          >
            <SelectTrigger id={`${fieldPrefix}-model`} className="h-8 text-sm">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {providerModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor={`${fieldPrefix}-description`} className="text-xs">Description</Label>
        <Textarea
          id={`${fieldPrefix}-description`}
          value={agent.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What does this agent do?"
          className="min-h-[60px] text-sm"
        />
      </div>

      <div>
        <Label htmlFor={`${fieldPrefix}-vibe`} className="text-xs">Vibe / Personality</Label>
        <Input
          id={`${fieldPrefix}-vibe`}
          value={agent.vibe}
          onChange={(e) => onChange({ vibe: e.target.value })}
          placeholder="Tenace, methodique, jamais fatigue"
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
