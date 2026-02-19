'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FamilyCard } from '@/components/families/family-card';
import { useFamilyStore } from '@/stores/family-store';
import { useAgentStore } from '@/stores/agent-store';
import { getPresetAgents } from '@/config/presets';
import { useBackendHealth } from '@/hooks/useBackendHealth';

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

export default function FamiliesPage() {
  const router = useRouter();
  const families = useFamilyStore((s) => s.families);
  const initializePresets = useAgentStore((s) => s.initializePresets);

  useBackendHealth();

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
              <h1 className="text-2xl font-semibold">Families</h1>
              <p className="text-sm text-muted-foreground">
                {families.length} famil{families.length !== 1 ? 'ies' : 'y'} configured
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/families/new')}>
            <Plus className="size-4" />
            Create Family
          </Button>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {families.map((family) => (
            <motion.div key={family.id} variants={item}>
              <FamilyCard
                family={family}
                onClick={() => router.push(`/families/${family.id}`)}
              />
            </motion.div>
          ))}

          <motion.div variants={item}>
            <button
              onClick={() => router.push('/families/new')}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors min-h-[180px] w-full cursor-pointer"
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
                <Plus className="size-7 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Create Family
              </span>
            </button>
          </motion.div>
        </motion.div>

        {families.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">No families yet</p>
            <p className="text-sm text-muted-foreground">
              Create a family to group agents for collaborative conversations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
