'use client';

import { useGenesisStore } from '@/stores/genesis-store';
import { CAPABILITY_OPTIONS, OUTPUT_OPTIONS } from '@/types/genesis';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

export function WizardStepCapabilities() {
  const familySpec = useGenesisStore((s) => s.familySpec);
  const updateFamilySpec = useGenesisStore((s) => s.updateFamilySpec);

  const capabilities = familySpec.capabilities || [];
  const outputs = familySpec.outputs || [];
  const schedule = familySpec.schedule || {};

  const toggleCapability = (cap: string) => {
    const updated = capabilities.includes(cap)
      ? capabilities.filter((c) => c !== cap)
      : [...capabilities, cap];
    updateFamilySpec({ capabilities: updated });
  };

  const toggleOutput = (out: string) => {
    const updated = outputs.includes(out)
      ? outputs.filter((o) => o !== out)
      : [...outputs, out];
    updateFamilySpec({ outputs: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Select capabilities, output formats, and schedule.
        </p>
      </div>

      {/* Capabilities */}
      <div className="space-y-3">
        <Label>Capabilities</Label>
        <div className="flex flex-wrap gap-2">
          {CAPABILITY_OPTIONS.map((cap) => (
            <ToggleChip
              key={cap}
              label={cap}
              selected={capabilities.includes(cap)}
              onClick={() => toggleCapability(cap)}
            />
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div className="space-y-3">
        <Label>Output Formats</Label>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_OPTIONS.map((out) => (
            <ToggleChip
              key={out}
              label={out}
              selected={outputs.includes(out)}
              onClick={() => toggleOutput(out)}
            />
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-3">
        <Label>Schedule (optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Job Name</Label>
            <Input
              placeholder="daily-report"
              className="h-8 text-sm"
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && !schedule[name]) {
                  updateFamilySpec({
                    schedule: { ...schedule, [name]: '0 7 * * *' },
                  });
                }
              }}
            />
          </div>
          <div>
            <Label className="text-xs">Cron Expression</Label>
            <Input
              placeholder="0 7 * * *"
              className="h-8 text-sm font-mono"
              value={Object.values(schedule)[0] || ''}
              onChange={(e) => {
                const key = Object.keys(schedule)[0];
                if (key) {
                  updateFamilySpec({
                    schedule: { ...schedule, [key]: e.target.value },
                  });
                }
              }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Example: 0 7 * * * = daily at 7:00 UTC
        </p>
      </div>
    </div>
  );
}
