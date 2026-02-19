'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FamilyEditor } from '@/components/families/family-editor';
import { useFamilyStore } from '@/stores/family-store';
import { useAgentStore } from '@/stores/agent-store';
import { getPresetAgents } from '@/config/presets';

export default function FamilyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const getFamily = useFamilyStore((s) => s.getFamily);
  const initializePresets = useAgentStore((s) => s.initializePresets);

  useEffect(() => {
    initializePresets(getPresetAgents());
  }, [initializePresets]);

  const isNew = id === 'new';
  const family = isNew ? undefined : getFamily(id);

  if (!isNew && !family) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/families')}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-2xl font-semibold">Family not found</h1>
          </div>
          <p className="text-muted-foreground">
            The family you are looking for does not exist or has been deleted.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/families')}
          >
            Back to families
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/families')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {isNew ? 'Create Family' : `Edit ${family!.name}`}
          </h1>
        </div>

        <FamilyEditor
          family={family}
          onSave={() => router.push('/families')}
          onDelete={() => router.push('/families')}
        />
      </div>
    </div>
  );
}
