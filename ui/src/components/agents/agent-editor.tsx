'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { AgentAvatar } from '@/components/agents/agent-avatar';
import { useAgentStore } from '@/stores/agent-store';
import { useBackendStore } from '@/stores/backend-store';
import { getPresetAgents } from '@/config/presets';
import type { Agent, AgentCreate } from '@/types/agent';

/** Maps model aliases to their underlying LLM (from openclaw.template.json). */
const MODEL_LABELS: Record<string, string> = {
  maman: 'Claude Opus 4 (Anthropic)',
  henry: 'GLM-4.7 (Z.AI)',
  sage: 'Gemini 2.5 Pro (Google)',
  nova: 'GPT-5.3-Codex (OpenAI)',
  blaise: 'Claude Opus 4.6 (Anthropic)',
  biblio: 'GLM-4.7 (Z.AI)',
};

function getModelLabel(model: string): string {
  const llm = MODEL_LABELS[model];
  return llm ? `${model} — ${llm}` : model;
}

interface AgentEditorProps {
  agent?: Agent;
  onSave?: () => void;
  onDelete?: () => void;
}

const defaultValues: AgentCreate = {
  name: '',
  emoji: '',
  creature: '',
  color: '#8b5cf6',
  description: '',
  systemPrompt: '',
  backendId: 'family-api',
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
  personality: {
    vibe: '',
    role: '',
    limitations: '',
  },
};

export function AgentEditor({ agent, onSave, onDelete }: AgentEditorProps) {
  const addAgent = useAgentStore((s) => s.addAgent);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const removeAgent = useAgentStore((s) => s.removeAgent);
  const backends = useBackendStore((s) => s.backends);

  const getBackend = useBackendStore((s) => s.getBackend);

  const isEditing = !!agent;
  const isPreset = agent?.isPreset ?? false;

  const [form, setForm] = useState<AgentCreate>(() => {
    if (agent) {
      return {
        name: agent.name,
        emoji: agent.emoji,
        creature: agent.creature,
        color: agent.color,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        backendId: agent.backendId,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        personality: { ...agent.personality },
      };
    }
    return { ...defaultValues, personality: { ...defaultValues.personality } };
  });

  const selectedBackend = getBackend(form.backendId);
  const selectedBackendModels = selectedBackend?.models || [];

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateField = useCallback(
    <K extends keyof AgentCreate>(key: K, value: AgentCreate[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updatePersonality = useCallback(
    (key: keyof AgentCreate['personality'], value: string) => {
      setForm((prev) => ({
        ...prev,
        personality: { ...prev.personality, [key]: value },
      }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('Agent name is required');
      return;
    }
    if (!form.model.trim()) {
      toast.error('Model name is required');
      return;
    }

    if (isEditing && agent) {
      updateAgent(agent.id, form);
      toast.success(`Agent "${form.name}" updated`);
    } else {
      addAgent(form);
      toast.success(`Agent "${form.name}" created`);
    }

    onSave?.();
  }, [form, isEditing, agent, updateAgent, addAgent, onSave]);

  const handleDelete = useCallback(() => {
    if (!agent) return;
    removeAgent(agent.id);
    toast.success(`Agent "${agent.name}" deleted`);
    setDeleteDialogOpen(false);
    onDelete?.();
  }, [agent, removeAgent, onDelete]);

  const handleImportPreset = useCallback(
    (presetName: string) => {
      const presets = getPresetAgents();
      const preset = presets.find((p) => p.name === presetName);
      if (!preset) return;

      setForm({
        name: preset.name,
        emoji: preset.emoji,
        creature: preset.creature,
        color: preset.color,
        description: preset.description,
        systemPrompt: preset.systemPrompt,
        backendId: preset.backendId,
        model: preset.model,
        temperature: preset.temperature,
        maxTokens: preset.maxTokens,
        personality: { ...preset.personality },
      });
      toast.success(`Imported config from "${presetName}"`);
    },
    []
  );

  const presetNames = getPresetAgents().map((p) => p.name);

  return (
    <div className="space-y-8">
      {/* Import from Preset */}
      {!isEditing && (
        <div className="flex items-center gap-3">
          <Download className="size-4 text-muted-foreground" />
          <Select onValueChange={handleImportPreset}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Import from preset..." />
            </SelectTrigger>
            <SelectContent>
              {presetNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Identity Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Identity</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <AgentAvatar
              emoji={form.emoji || '?'}
              color={form.color}
              size="xl"
            />
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Agent name"
                  />
                </div>
                <div>
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={form.emoji}
                    onChange={(e) => updateField('emoji', e.target.value)}
                    placeholder="Single emoji"
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creature">Creature / Archetype</Label>
                  <Input
                    id="creature"
                    value={form.creature}
                    onChange={(e) => updateField('creature', e.target.value)}
                    placeholder="e.g. AI matriarch"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <div
                      className="h-9 w-9 rounded-md border shrink-0"
                      style={{ backgroundColor: form.color }}
                    />
                    <Input
                      id="color"
                      value={form.color}
                      onChange={(e) => updateField('color', e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="What does this agent do?"
              className="min-h-[80px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* System Prompt */}
      <section>
        <h2 className="text-lg font-semibold mb-4">System Prompt</h2>
        <Textarea
          value={form.systemPrompt}
          onChange={(e) => updateField('systemPrompt', e.target.value)}
          placeholder="Enter the system prompt that defines this agent's behavior..."
          className="min-h-[200px] font-mono text-sm"
        />
      </section>

      <Separator />

      {/* Model Configuration */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Model Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="backend">Backend</Label>
            <Select
              value={form.backendId}
              onValueChange={(v) => updateField('backendId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select backend" />
              </SelectTrigger>
              <SelectContent>
                {backends.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            {selectedBackendModels.length > 0 ? (
              <Select
                value={form.model}
                onValueChange={(v) => updateField('model', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model">
                    {form.model ? getModelLabel(form.model) : 'Select model'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {selectedBackendModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {getModelLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="model"
                value={form.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="Model name (e.g. maman, henry)"
              />
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Parameters */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Parameters</h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Temperature</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {form.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[form.temperature]}
              onValueChange={([v]) => updateField('temperature', v)}
              min={0}
              max={2}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Max Tokens</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {form.maxTokens}
              </span>
            </div>
            <Slider
              value={[form.maxTokens]}
              onValueChange={([v]) => updateField('maxTokens', v)}
              min={256}
              max={8192}
              step={256}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>256</span>
              <span>8192</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Personality */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Personality</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="vibe">Vibe</Label>
            <Input
              id="vibe"
              value={form.personality.vibe}
              onChange={(e) => updatePersonality('vibe', e.target.value)}
              placeholder="e.g. Warm but direct"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={form.personality.role}
              onChange={(e) => updatePersonality('role', e.target.value)}
              placeholder="e.g. Orchestration, memory"
            />
          </div>
          <div>
            <Label htmlFor="limitations">Limitations</Label>
            <Input
              id="limitations"
              value={form.personality.limitations}
              onChange={(e) => updatePersonality('limitations', e.target.value)}
              placeholder="e.g. Papa has the final word"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {isEditing && !isPreset && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="size-4" />
                  Delete Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete &ldquo;{agent?.name}&rdquo;?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The agent will be permanently
                    removed. Conversations referencing this agent will still
                    exist but the agent details will be unavailable.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {isPreset && (
            <p className="text-xs text-muted-foreground">
              Preset agents cannot be deleted
            </p>
          )}
        </div>

        <Button onClick={handleSave}>
          <Save className="size-4" />
          {isEditing ? 'Save Changes' : 'Create Agent'}
        </Button>
      </div>
    </div>
  );
}
