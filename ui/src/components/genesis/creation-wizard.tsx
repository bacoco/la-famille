'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenesisStore } from '@/stores/genesis-store';
import { WizardStepIdentity } from './wizard-step-identity';
import { WizardStepAgents } from './wizard-step-agents';
import { WizardStepCapabilities } from './wizard-step-capabilities';
import { WizardStepReview } from './wizard-step-review';
import { WizardStepDeploy } from './wizard-step-deploy';
import { cn } from '@/lib/utils';

/** Centralized Genesis config from env vars */
function getGenesisConfig() {
  return {
    genesisUrl: process.env.NEXT_PUBLIC_GENESIS_URL || 'http://localhost:3200',
    token: process.env.NEXT_PUBLIC_GENESIS_TOKEN || 'dev-token',
  };
}

const STEPS = [
  { label: 'Identity', emoji: '🎨' },
  { label: 'Agents', emoji: '🤖' },
  { label: 'Config', emoji: '⚙️' },
  { label: 'Review', emoji: '👁️' },
  { label: 'Deploy', emoji: '🚀' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              idx === currentStep
                ? 'bg-primary text-primary-foreground'
                : idx < currentStep
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            <span>{step.emoji}</span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                'h-px w-4 transition-colors',
                idx < currentStep ? 'bg-green-500/50' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CreationWizard() {
  const wizardStep = useGenesisStore((s) => s.wizardStep);
  const nextStep = useGenesisStore((s) => s.nextStep);
  const prevStep = useGenesisStore((s) => s.prevStep);
  const familySpec = useGenesisStore((s) => s.familySpec);
  const pipelineStatus = useGenesisStore((s) => s.pipelineStatus);
  const startPipeline = useGenesisStore((s) => s.startPipeline);

  const canProceed = () => {
    switch (wizardStep) {
      case 0:
        return !!(familySpec.name && familySpec.displayName && familySpec.emoji);
      case 1: {
        const agents = familySpec.agents || [];
        return (
          agents.length >= 1 &&
          agents.every(
            (a) => a.name && a.role && a.modelProvider && a.modelName
          )
        );
      }
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleDeploy = () => {
    const { genesisUrl, token } = getGenesisConfig();
    startPipeline(genesisUrl, token);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center">
        <StepIndicator currentStep={wizardStep} />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wizardStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {wizardStep === 0 && <WizardStepIdentity />}
          {wizardStep === 1 && <WizardStepAgents />}
          {wizardStep === 2 && <WizardStepCapabilities />}
          {wizardStep === 3 && <WizardStepReview />}
          {wizardStep === 4 && <WizardStepDeploy />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {wizardStep < 4 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={wizardStep === 0}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {wizardStep < 3 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleDeploy}
              disabled={pipelineStatus === 'running'}
              className="bg-green-600 hover:bg-green-700"
            >
              <Rocket className="size-4" />
              Create Family
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
