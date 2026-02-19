'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenesisStore } from '@/stores/genesis-store';
import { AgentSpecForm } from './agent-spec-form';

export function WizardStepAgents() {
  const agents = useGenesisStore((s) => s.familySpec.agents || []);
  const addAgent = useGenesisStore((s) => s.addAgent);
  const removeAgent = useGenesisStore((s) => s.removeAgent);
  const updateAgent = useGenesisStore((s) => s.updateAgent);
  const moveAgent = useGenesisStore((s) => s.moveAgent);

  const handleAddAgent = () => {
    addAgent({
      name: '',
      emoji: '',
      role: '',
      description: '',
      modelProvider: 'anthropic',
      modelName: 'claude-opus-4.6',
      vibe: '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Agents</h2>
        <p className="text-sm text-muted-foreground">
          Define the agents in your family. Each agent has a unique role and
          personality.
        </p>
      </div>

      <div className="space-y-4">
        {agents.map((agent, idx) => (
          <AgentSpecForm
            key={agent._tempId}
            agent={agent}
            index={idx}
            totalCount={agents.length}
            onChange={(updates) => updateAgent(idx, updates)}
            onRemove={() => removeAgent(idx)}
            onMove={(dir) => moveAgent(idx, dir)}
          />
        ))}

        <Button
          variant="outline"
          onClick={handleAddAgent}
          className="w-full border-dashed"
        >
          <Plus className="size-4" />
          Add Agent
        </Button>
      </div>

      {agents.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Add at least one agent to continue.
        </p>
      )}
    </div>
  );
}
