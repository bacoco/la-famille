'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/agents/agent-card';
import { useAgentStore } from '@/stores/agent-store';
import { getPresetAgents } from '@/config/presets';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AgentsPage() {
  const router = useRouter();
  const agents = useAgentStore((s) => s.agents);
  const initializePresets = useAgentStore((s) => s.initializePresets);

  useEffect(() => {
    initializePresets(getPresetAgents());
  }, [initializePresets]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/chat')}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Agents</h1>
              <p className="text-sm text-muted-foreground">
                {agents.length} agent{agents.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/agents/new')}>
            <Plus className="size-4" />
            Create Agent
          </Button>
        </div>

        <motion.div
          key={agents.length}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {agents.map((agent) => (
            <motion.div key={agent.id} variants={item}>
              <AgentCard
                agent={agent}
                onClick={() => router.push(`/agents/${agent.id}`)}
              />
            </motion.div>
          ))}

          <motion.div variants={item}>
            <button
              onClick={() => router.push('/agents/new')}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors min-h-[220px] w-full cursor-pointer"
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
                <Plus className="size-7 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Create Agent
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
