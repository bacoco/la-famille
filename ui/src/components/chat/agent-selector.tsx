'use client';

import { useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/stores/agent-store';
import { Agent } from '@/types/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface AgentSelectorProps {
  currentAgentId?: string;
  onSelect: (agentId: string) => void;
}

export function AgentSelector({ currentAgentId, onSelect }: AgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const agents = useAgentStore((s) => s.agents);
  const currentAgent = agents.find((a) => a.id === currentAgentId);

  const presetAgents = agents.filter((a) => a.isPreset);
  const customAgents = agents.filter((a) => !a.isPreset);

  const handleSelect = (agent: Agent) => {
    onSelect(agent.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Select agent"
          className="h-auto gap-2 px-3 py-1.5 text-sm font-normal hover:bg-muted/50"
        >
          {currentAgent ? (
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-sm"
                style={{
                  backgroundColor: `${currentAgent.color}20`,
                  border: `1px solid ${currentAgent.color}40`,
                }}
              >
                {currentAgent.emoji}
              </span>
              <span className="font-medium">{currentAgent.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select agent...</span>
          )}
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList>
            <CommandEmpty>No agents found.</CommandEmpty>

            {presetAgents.length > 0 && (
              <CommandGroup heading="Famille">
                {presetAgents.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={agent.name}
                    onSelect={() => handleSelect(agent)}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                      style={{
                        backgroundColor: `${agent.color}20`,
                        border: `1px solid ${agent.color}40`,
                      }}
                    >
                      {agent.emoji}
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{agent.name}</span>
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[10px] font-normal"
                        >
                          {agent.model}
                        </Badge>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {agent.description}
                      </span>
                    </div>
                    {agent.id === currentAgentId && (
                      <Check className="h-4 w-4 shrink-0 text-orange-500" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {customAgents.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Custom">
                  {customAgents.map((agent) => (
                    <CommandItem
                      key={agent.id}
                      value={agent.name}
                      onSelect={() => handleSelect(agent)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                        style={{
                          backgroundColor: `${agent.color}20`,
                          border: `1px solid ${agent.color}40`,
                        }}
                      >
                        {agent.emoji}
                      </span>
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {agent.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] font-normal"
                          >
                            {agent.model}
                          </Badge>
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {agent.description}
                        </span>
                      </div>
                      {agent.id === currentAgentId && (
                        <Check className="h-4 w-4 shrink-0 text-orange-500" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
