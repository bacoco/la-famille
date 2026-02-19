'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineLogEntry } from '@/types/genesis';

interface PipelineProgressProps {
  logs: PipelineLogEntry[];
  status: 'idle' | 'running' | 'complete' | 'error';
}

const STAGES = [
  { id: 'validation', label: 'Validation', emoji: '✓' },
  { id: 'architecte', label: 'Architecte', emoji: '🏗️' },
  { id: 'scribe', label: 'Scribe', emoji: '📜' },
  { id: 'forgeron', label: 'Forgeron', emoji: '🔨' },
] as const;

function getStageStatus(
  stageId: string,
  logs: PipelineLogEntry[],
  pipelineStatus: string
) {
  const stageLogs = logs.filter((l) => l.stage === stageId);
  if (stageLogs.length === 0) {
    // If the global pipeline errored, mark pending stages as error
    if (pipelineStatus === 'error') return 'pending';
    return 'pending';
  }
  const hasError = stageLogs.some((l) => l.level === 'error');
  const hasSuccess = stageLogs.some((l) => l.level === 'success');
  if (hasError) return 'error';
  if (hasSuccess) return 'complete';
  // If the pipeline errored globally while this stage was running, mark it as error
  if (pipelineStatus === 'error') return 'error';
  return 'running';
}

export function PipelineProgress({
  logs,
  status,
}: PipelineProgressProps) {
  return (
    <div className="space-y-3">
      {STAGES.map((stage, idx) => {
        const stageStatus = getStageStatus(stage.id, logs, status);

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-colors',
              stageStatus === 'complete' && 'border-green-500/30 bg-green-500/5',
              stageStatus === 'running' && 'border-blue-500/30 bg-blue-500/5',
              stageStatus === 'error' && 'border-red-500/30 bg-red-500/5',
              stageStatus === 'pending' && 'border-border/50 opacity-50'
            )}
          >
            {/* Status icon */}
            <div className="shrink-0">
              {stageStatus === 'complete' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              {stageStatus === 'running' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                </div>
              )}
              {stageStatus === 'error' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
              {stageStatus === 'pending' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm">{stage.emoji}</span>
                </div>
              )}
            </div>

            {/* Label + messages */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{stage.label}</p>
              {logs
                .filter((l) => l.stage === stage.id)
                .slice(-1)
                .map((log, i) => (
                  <p
                    key={i}
                    className={cn(
                      'text-xs mt-0.5 truncate',
                      log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'success'
                          ? 'text-green-400'
                          : 'text-muted-foreground'
                    )}
                  >
                    {log.message}
                  </p>
                ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
