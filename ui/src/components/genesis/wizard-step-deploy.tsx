'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RotateCcw, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenesisStore } from '@/stores/genesis-store';
import { PipelineProgress } from './pipeline-progress';

/** Centralized Genesis config from env vars */
function getGenesisConfig() {
  return {
    genesisUrl: process.env.NEXT_PUBLIC_GENESIS_URL || 'http://localhost:3200',
    token: process.env.NEXT_PUBLIC_GENESIS_TOKEN || 'dev-token',
  };
}

export function WizardStepDeploy() {
  const router = useRouter();
  const pipelineStatus = useGenesisStore((s) => s.pipelineStatus);
  const pipelineLogs = useGenesisStore((s) => s.pipelineLogs);
  const pipelineResult = useGenesisStore((s) => s.pipelineResult);
  const familySpec = useGenesisStore((s) => s.familySpec);
  const resetWizard = useGenesisStore((s) => s.resetWizard);
  const startPipeline = useGenesisStore((s) => s.startPipeline);
  const registerCreatedFamily = useGenesisStore((s) => s.registerCreatedFamily);
  const registered = useGenesisStore((s) => s._registered);
  const setWizardStep = useGenesisStore((s) => s.setWizardStep);

  // Auto-register backend + presets on successful completion
  useEffect(() => {
    if (pipelineStatus === 'complete' && !registered) {
      registerCreatedFamily();
    }
  }, [pipelineStatus, registered, registerCreatedFamily]);

  const handleRetry = () => {
    const { genesisUrl, token } = getGenesisConfig();
    startPipeline(genesisUrl, token);
  };

  // Find which stage failed
  const failedStage = pipelineLogs
    .filter((l) => l.level === 'error')
    .map((l) => l.stage)
    .pop();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-4xl">
          {pipelineStatus === 'complete'
            ? '🎉'
            : pipelineStatus === 'error'
              ? '❌'
              : '🚀'}
        </span>
        <h2 className="text-lg font-semibold mt-2">
          {pipelineStatus === 'idle' && 'Ready to Deploy'}
          {pipelineStatus === 'running' && `Creating ${familySpec.displayName}...`}
          {pipelineStatus === 'complete' && 'Family Created!'}
          {pipelineStatus === 'error' && 'Creation Failed'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {pipelineStatus === 'running' &&
            'Genesis is building your family. This may take a minute.'}
          {pipelineStatus === 'complete' && (
            <>
              {familySpec.displayName} is live on port {pipelineResult?.port || '?'}.
              {registered && (
                <span className="block text-green-400 mt-1">
                  Backend and agent presets registered automatically.
                </span>
              )}
            </>
          )}
          {pipelineStatus === 'error' && (
            <>
              {failedStage && (
                <span className="block text-red-400">
                  Failed at stage: <strong>{failedStage}</strong>
                </span>
              )}
              <span className="block mt-1">
                {pipelineResult?.error || 'An error occurred during creation.'}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Pipeline progress */}
      <PipelineProgress
        logs={pipelineLogs}
        status={pipelineStatus}
      />

      {/* Build logs */}
      {pipelineLogs.length > 0 && (
        <details className="group" open={pipelineStatus === 'error'}>
          <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            Build logs ({pipelineLogs.length} entries)
          </summary>
          <div className="mt-2 rounded-lg bg-muted/30 p-3 max-h-[200px] overflow-auto font-mono text-xs space-y-1">
            {pipelineLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.level === 'error'
                    ? 'text-red-400'
                    : log.level === 'success'
                      ? 'text-green-400'
                      : log.level === 'warn'
                        ? 'text-yellow-400'
                        : 'text-muted-foreground'
                }
              >
                [{log.stage}] {log.message}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Actions — Success */}
      {pipelineStatus === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 pt-4"
        >
          <Button
            variant="outline"
            onClick={() => {
              resetWizard();
              router.push('/genesis');
            }}
          >
            <RotateCcw className="size-4" />
            Create Another
          </Button>
          <Button onClick={() => router.push('/families')}>
            <ExternalLink className="size-4" />
            View Families
          </Button>
        </motion.div>
      )}

      {/* Actions — Error */}
      {pipelineStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 pt-4"
        >
          <Button
            variant="outline"
            onClick={() => setWizardStep(3)}
          >
            <ArrowLeft className="size-4" />
            Back to Review
          </Button>
          <Button
            variant="outline"
            onClick={handleRetry}
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetWizard()}
            className="text-muted-foreground"
          >
            Start Over
          </Button>
        </motion.div>
      )}
    </div>
  );
}
