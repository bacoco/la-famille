'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreationWizard } from '@/components/genesis/creation-wizard';
import { useGenesisStore } from '@/stores/genesis-store';

export default function GenesisCreatePage() {
  const router = useRouter();
  const resetWizard = useGenesisStore((s) => s.resetWizard);

  // Reset wizard state on mount
  useEffect(() => {
    resetWizard();
  }, [resetWizard]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/genesis')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <h1 className="text-2xl font-semibold">Create Family</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Genesis will design, scaffold, and deploy your new family.
            </p>
          </div>
        </div>

        {/* Wizard */}
        <CreationWizard />
      </div>
    </div>
  );
}
