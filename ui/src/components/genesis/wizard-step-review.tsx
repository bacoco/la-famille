'use client';

import { useGenesisStore } from '@/stores/genesis-store';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function WizardStepReview() {
  const familySpec = useGenesisStore((s) => s.familySpec);
  const agents = familySpec.agents || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">
          Review your family configuration before creation.
        </p>
      </div>

      {/* Family identity */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{familySpec.emoji}</span>
          <div>
            <h3 className="text-base font-semibold">
              {familySpec.displayName}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {familySpec.name}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {familySpec.description}
        </p>
      </div>

      <Separator />

      {/* Agents */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">
          Agents ({agents.length})
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {agents.map((agent, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span className="text-xl shrink-0">{agent.emoji || '🤖'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {agent.role} — {agent.modelProvider}/{agent.modelName}
                </p>
                {agent.vibe && (
                  <p className="text-xs text-muted-foreground/60 truncate italic">
                    {agent.vibe}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Capabilities & Outputs */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Capabilities</h3>
          <div className="flex flex-wrap gap-1.5">
            {(familySpec.capabilities || []).length > 0 ? (
              familySpec.capabilities!.map((cap) => (
                <Badge key={cap} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">None</span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Outputs</h3>
          <div className="flex flex-wrap gap-1.5">
            {(familySpec.outputs || []).length > 0 ? (
              familySpec.outputs!.map((out) => (
                <Badge key={out} variant="outline" className="text-xs">
                  {out}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Schedule */}
      {Object.keys(familySpec.schedule || {}).length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Schedule</h3>
            {Object.entries(familySpec.schedule!).map(([name, cron]) => (
              <div key={name} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-mono">
                  {cron}
                </Badge>
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Preview JSON */}
      <Separator />
      <details className="group">
        <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
          family.json preview
        </summary>
        <pre className="mt-2 rounded-lg bg-muted/50 p-3 text-xs overflow-auto max-h-[300px] font-mono">
          {JSON.stringify(
            {
              name: familySpec.name,
              displayName: familySpec.displayName,
              emoji: familySpec.emoji,
              version: '1.0.0',
              description: familySpec.description,
              agents: agents.map((a) => ({
                name: a.name,
                emoji: a.emoji,
                model: { provider: a.modelProvider, name: a.modelName },
                role: a.role,
              })),
              capabilities: familySpec.capabilities,
              outputs: familySpec.outputs,
              schedule: familySpec.schedule,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}
