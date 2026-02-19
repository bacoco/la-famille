'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentEditor } from '@/components/agents/agent-editor';
import { useAgentStore } from '@/stores/agent-store';
import { getPresetAgents } from '@/config/presets';

export default function AgentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const getAgent = useAgentStore((s) => s.getAgent);
  const initializePresets = useAgentStore((s) => s.initializePresets);

  useEffect(() => {
    initializePresets(getPresetAgents());
  }, [initializePresets]);

  const isNew = id === 'new';
  const agent = isNew ? undefined : getAgent(id);

  if (!isNew && !agent) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/agents')}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-2xl font-semibold">Agent not found</h1>
          </div>
          <p className="text-muted-foreground">
            The agent you are looking for does not exist or has been deleted.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/agents')}
          >
            Back to agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/agents')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {isNew ? 'Create Agent' : `Edit ${agent!.name}`}
          </h1>
        </div>

        <AgentEditor
          agent={agent}
          onSave={() => router.push('/agents')}
          onDelete={() => router.push('/agents')}
        />
      </div>
    </div>
  );
}
