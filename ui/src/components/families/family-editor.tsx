'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Trash2,
  Save,
  X,
  Plus,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { useFamilyStore } from '@/stores/family-store';
import { useAgentStore } from '@/stores/agent-store';
import type { Family, FamilyMember } from '@/types/family';

interface FamilyEditorProps {
  family?: Family;
  onSave?: () => void;
  onDelete?: () => void;
}

interface MemberDraft extends FamilyMember {
  _key: string; // local key for React rendering
}

export function FamilyEditor({ family, onSave, onDelete }: FamilyEditorProps) {
  const addFamily = useFamilyStore((s) => s.addFamily);
  const updateFamily = useFamilyStore((s) => s.updateFamily);
  const removeFamily = useFamilyStore((s) => s.removeFamily);
  const agents = useAgentStore((s) => s.agents);

  const isEditing = !!family;

  const [name, setName] = useState(family?.name ?? '');
  const [emoji, setEmoji] = useState(family?.emoji ?? '');
  const [description, setDescription] = useState(family?.description ?? '');
  const [members, setMembers] = useState<MemberDraft[]>(() =>
    (family?.members ?? []).map((m, i) => ({
      ...m,
      _key: `existing-${i}`,
    }))
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Agents that are not yet members
  const availableAgents = agents.filter(
    (a) => !members.some((m) => m.agentId === a.id)
  );

  const addMember = useCallback(
    (agentId: string) => {
      setMembers((prev) => [
        ...prev,
        {
          agentId,
          role: '',
          order: prev.length,
          _key: `new-${Date.now()}-${agentId}`,
        },
      ]);
    },
    []
  );

  const removeMember = useCallback((agentId: string) => {
    setMembers((prev) => {
      const filtered = prev.filter((m) => m.agentId !== agentId);
      return filtered.map((m, i) => ({ ...m, order: i }));
    });
  }, []);

  const updateMemberRole = useCallback((agentId: string, role: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.agentId === agentId ? { ...m, role } : m))
    );
  }, []);

  const moveMember = useCallback((agentId: string, direction: 'up' | 'down') => {
    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.agentId === agentId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy.map((m, i) => ({ ...m, order: i }));
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error('Family name is required');
      return;
    }

    const cleanMembers: FamilyMember[] = members.map(({ _key, ...rest }) => rest);

    if (isEditing && family) {
      updateFamily(family.id, {
        name: name.trim(),
        emoji,
        description: description.trim(),
        members: cleanMembers,
      });
      toast.success(`Family "${name}" updated`);
    } else {
      addFamily({
        name: name.trim(),
        emoji,
        description: description.trim(),
        members: cleanMembers,
      });
      toast.success(`Family "${name}" created`);
    }

    onSave?.();
  }, [name, emoji, description, members, isEditing, family, updateFamily, addFamily, onSave]);

  const handleDelete = useCallback(() => {
    if (!family) return;
    removeFamily(family.id);
    toast.success(`Family "${family.name}" deleted`);
    setDeleteDialogOpen(false);
    onDelete?.();
  }, [family, removeFamily, onDelete]);

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_100px] gap-4">
            <div>
              <Label htmlFor="family-name">Name</Label>
              <Input
                id="family-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Family name"
              />
            </div>
            <div>
              <Label htmlFor="family-emoji">Emoji</Label>
              <Input
                id="family-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="Emoji"
                maxLength={4}
                className="text-center text-xl"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="family-desc">Description</Label>
            <Textarea
              id="family-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this family for?"
              className="min-h-[80px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Member Management */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Available Agents */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Available Agents
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {availableAgents.length === 0 && (
                <p className="text-sm text-muted-foreground/60 italic py-4 text-center">
                  All agents are already members
                </p>
              )}
              {availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => addMember(agent.id)}
                  className="flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 hover:border-primary/30 cursor-pointer"
                >
                  <AgentAvatar
                    emoji={agent.emoji}
                    color={agent.color}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {agent.creature}
                    </p>
                  </div>
                  <Plus className="size-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Family Members */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Family Members ({members.length})
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground/60 italic py-4 text-center">
                  Click an agent to add them
                </p>
              )}
              {members.map((member, idx) => {
                const agent = agents.find((a) => a.id === member.agentId);
                if (!agent) return null;

                return (
                  <div
                    key={member._key}
                    className="flex items-center gap-2 rounded-lg border bg-card p-3"
                  >
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveMember(member.agentId, 'up')}
                        disabled={idx === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <GripVertical className="size-3" />
                      </button>
                      <button
                        onClick={() => moveMember(member.agentId, 'down')}
                        disabled={idx === members.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rotate-180"
                      >
                        <GripVertical className="size-3" />
                      </button>
                    </div>

                    <AgentAvatar
                      emoji={agent.emoji}
                      color={agent.color}
                      size="sm"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{agent.name}</p>
                      <Input
                        value={member.role}
                        onChange={(e) =>
                          updateMemberRole(member.agentId, e.target.value)
                        }
                        placeholder="Role in family..."
                        className="h-7 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono w-5 text-center">
                        #{idx + 1}
                      </span>
                      <button
                        onClick={() => removeMember(member.agentId)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {isEditing && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="size-4" />
                  Delete Family
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete &ldquo;{family?.name}&rdquo;?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The family will be permanently
                    deleted. The agents themselves will not be affected.
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
        </div>

        <Button onClick={handleSave}>
          <Save className="size-4" />
          {isEditing ? 'Save Changes' : 'Create Family'}
        </Button>
      </div>
    </div>
  );
}
