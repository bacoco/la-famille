'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const GENESIS_URL =
  process.env.NEXT_PUBLIC_GENESIS_URL || 'http://localhost:3200';
const GENESIS_TOKEN =
  process.env.NEXT_PUBLIC_GENESIS_TOKEN || 'dev-token';

interface FamilyStatus {
  name: string;
  displayName: string;
  emoji: string;
  agents: number;
  status: string;
  port?: number;
  description: string;
  containerHealth?: string;
}

export default function FamilyStatusPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = use(params);
  const router = useRouter();
  const [family, setFamily] = useState<FamilyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${GENESIS_URL}/v1/families/${familyId}/status`,
        { headers: { Authorization: `Bearer ${GENESIS_TOKEN}` } }
      );
      if (res.ok) {
        setFamily(await res.json());
      }
    } catch {
      // Genesis not available
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await fetch(`${GENESIS_URL}/v1/families/${familyId}/restart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GENESIS_TOKEN}` },
      });
      // Wait a bit then refresh status, only clear restarting after fetchStatus completes
      setTimeout(async () => {
        await fetchStatus();
        setRestarting(false);
      }, 3000);
    } catch {
      setRestarting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/genesis')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              Family &ldquo;{familyId}&rdquo; not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/genesis')}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{family.emoji}</span>
              <div>
                <h1 className="text-2xl font-semibold">
                  {family.displayName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {family.agents} agent{family.agents !== 1 ? 's' : ''}
                  {family.port && (
                    <span className="ml-2 font-mono">:{family.port}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchStatus}
            >
              <RefreshCw className="size-4" />
            </Button>
            {family.port && (
              <Button
                variant="outline"
                onClick={handleRestart}
                disabled={restarting}
              >
                <Power className={cn('size-4', restarting && 'animate-spin')} />
                Restart
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge
                className={cn(
                  'text-xs',
                  family.status === 'active' &&
                    'bg-green-500/20 text-green-400 border-green-500/30'
                )}
              >
                {family.status}
              </Badge>
            </div>
            {family.containerHealth && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Container</span>
                <Badge
                  className={cn(
                    'text-xs',
                    family.containerHealth === 'healthy' &&
                      'bg-green-500/20 text-green-400 border-green-500/30',
                    family.containerHealth === 'unhealthy' &&
                      'bg-red-500/20 text-red-400 border-red-500/30',
                    family.containerHealth === 'unreachable' &&
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  )}
                >
                  {family.containerHealth}
                </Badge>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              {family.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
