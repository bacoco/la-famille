'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGenesisStore } from '@/stores/genesis-store';

export function WizardStepIdentity() {
  const familySpec = useGenesisStore((s) => s.familySpec);
  const updateFamilySpec = useGenesisStore((s) => s.updateFamilySpec);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Family Identity</h2>
        <p className="text-sm text-muted-foreground">
          Choose a name, emoji, and description for your new family.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_100px] gap-4">
          <div>
            <Label htmlFor="family-name">Name (kebab-case)</Label>
            <Input
              id="family-name"
              value={familySpec.name || ''}
              onChange={(e) =>
                updateFamilySpec({
                  name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                })
              }
              placeholder="sentinel"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unique identifier, lowercase, hyphens only
            </p>
          </div>
          <div>
            <Label htmlFor="family-emoji">Emoji</Label>
            <Input
              id="family-emoji"
              value={familySpec.emoji || ''}
              onChange={(e) => updateFamilySpec({ emoji: e.target.value })}
              placeholder="👁️"
              maxLength={4}
              className="text-center text-2xl"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="family-display">Display Name</Label>
          <Input
            id="family-display"
            value={familySpec.displayName || ''}
            onChange={(e) => updateFamilySpec({ displayName: e.target.value })}
            placeholder="Sentinel — Veille Concurrentielle"
          />
        </div>

        <div>
          <Label htmlFor="family-desc">Description</Label>
          <Textarea
            id="family-desc"
            value={familySpec.description || ''}
            onChange={(e) => updateFamilySpec({ description: e.target.value })}
            placeholder="Describe what this family of agents will do together..."
            className="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
