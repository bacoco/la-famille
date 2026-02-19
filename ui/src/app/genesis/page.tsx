'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, RefreshCw, Activity, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ContainerHealth = 'healthy' | 'unhealthy' | 'unreachable' | 'checking';

interface RegistryFamily {
  name: string;
  displayName: string;
  emoji: string;
  agents: number;
  status: string;
  port?: number;
  description: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function HealthDot({ health }: { health: ContainerHealth }) {
  return (
    <Circle
      className={cn(
        'size-2.5 fill-current',
        health === 'healthy' && 'text-green-500',
        health === 'unhealthy' && 'text-red-500',
        health === 'unreachable' && 'text-muted-foreground/40',
        health === 'checking' && 'text-yellow-500 animate-pulse'
      )}
    />
  );
}

function FamilyStatusCard({
  family,
  health,
}: {
  family: RegistryFamily;
  health: ContainerHealth;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{family.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {family.displayName}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {family.agents} agent{family.agents !== 1 ? 's' : ''}
            {family.port && (
              <span className="font-mono">:{family.port}</span>
            )}
            {family.status === 'active' && (
              <>
                <span className="text-border">|</span>
                <HealthDot health={health} />
                <span className={cn(
                  'text-[10px]',
                  health === 'healthy' && 'text-green-400',
                  health === 'unhealthy' && 'text-red-400',
                  health === 'unreachable' && 'text-muted-foreground/60',
                  health === 'checking' && 'text-yellow-400'
                )}>
                  {health}
                </span>
              </>
            )}
          </p>
        </div>
        <Badge
          variant={family.status === 'active' ? 'default' : 'secondary'}
          className={cn(
            'text-xs',
            family.status === 'active' && 'bg-green-500/20 text-green-400 border-green-500/30',
            family.status === 'planned' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            family.status === 'development' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          )}
        >
          {family.status}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {family.description}
      </p>
    </div>
  );
}

export default function GenesisPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<RegistryFamily[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, ContainerHealth>>({});

  const fetchFamilies = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const genesisUrl =
        process.env.NEXT_PUBLIC_GENESIS_URL || 'http://localhost:3200';
      const token =
        process.env.NEXT_PUBLIC_GENESIS_TOKEN || 'dev-token';

      const res = await fetch(`${genesisUrl}/v1/families`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFamilies(data.families || []);
      } else {
        setFetchError(`Genesis returned ${res.status} ${res.statusText}`);
      }
    } catch {
      setFetchError('Could not connect to Genesis service');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check health of active families with ports
  const checkHealth = useCallback(async (fams: RegistryFamily[]) => {
    const activeFams = fams.filter((f) => f.status === 'active' && f.port);
    if (activeFams.length === 0) return;

    // Set all to 'checking' initially
    setHealthMap((prev) => {
      const next = { ...prev };
      for (const f of activeFams) next[f.name] = 'checking';
      return next;
    });

    // Check each in parallel
    const results = await Promise.allSettled(
      activeFams.map(async (f) => {
        try {
          const res = await fetch(`http://localhost:${f.port}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          return { name: f.name, health: (res.ok ? 'healthy' : 'unhealthy') as ContainerHealth };
        } catch {
          return { name: f.name, health: 'unreachable' as ContainerHealth };
        }
      })
    );

    setHealthMap((prev) => {
      const next = { ...prev };
      for (const r of results) {
        if (r.status === 'fulfilled') next[r.value.name] = r.value.health;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  // Poll health every 30s for active families
  useEffect(() => {
    if (families.length === 0) return;
    checkHealth(families);
    const interval = setInterval(() => checkHealth(families), 30_000);
    return () => clearInterval(interval);
  }, [families, checkHealth]);

  const activeFamilies = families.filter((f) => f.status === 'active');
  const plannedFamilies = families.filter((f) => f.status === 'planned');
  const devFamilies = families.filter((f) => f.status === 'development');

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
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
              <div className="flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <h1 className="text-2xl font-semibold">Genesis</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Create and manage agent families
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchFamilies}>
              <RefreshCw
                className={cn('size-4', loading && 'animate-spin')}
              />
            </Button>
            <Button onClick={() => router.push('/genesis/create')}>
              <Plus className="size-4" />
              Create Family
            </Button>
          </div>
        </div>

        {/* Active families */}
        {activeFamilies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="size-3.5" />
              Active ({activeFamilies.length})
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {activeFamilies.map((f) => (
                <motion.div key={f.name} variants={item}>
                  <FamilyStatusCard family={f} health={healthMap[f.name] || 'unreachable'} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* In development */}
        {devFamilies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              In Development ({devFamilies.length})
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {devFamilies.map((f) => (
                <motion.div key={f.name} variants={item}>
                  <FamilyStatusCard family={f} health={healthMap[f.name] || 'unreachable'} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Planned families */}
        {plannedFamilies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Planned ({plannedFamilies.length})
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {plannedFamilies.map((f) => (
                <motion.div key={f.name} variants={item}>
                  <FamilyStatusCard family={f} health={healthMap[f.name] || 'unreachable'} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Error state */}
        {fetchError && families.length === 0 && !loading && (
          <div className="text-center py-16">
            <span className="text-4xl">⚠️</span>
            <p className="text-lg text-muted-foreground mt-4 mb-2">
              Genesis is not connected
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {fetchError}. Make sure the Genesis service is running on port 3200.
            </p>
            <Button onClick={() => router.push('/genesis/create')}>
              <Plus className="size-4" />
              Create Family Anyway
            </Button>
          </div>
        )}

        {/* Empty state (no error, just no families) */}
        {!fetchError && families.length === 0 && !loading && (
          <div className="text-center py-16">
            <span className="text-4xl">🌱</span>
            <p className="text-lg text-muted-foreground mt-4 mb-2">
              No families yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first agent family to get started.
            </p>
            <Button onClick={() => router.push('/genesis/create')}>
              <Plus className="size-4" />
              Create Family
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
