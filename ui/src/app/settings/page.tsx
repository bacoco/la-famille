'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Upload,
  Sun,
  Moon,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useBackendStore } from '@/stores/backend-store';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { useFamilyStore } from '@/stores/family-store';
import { useBackendHealth } from '@/hooks/use-backend-health';
import type { HealthStatus } from '@/types/backend';

function HealthDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: 'bg-green-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-400',
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`}
      title={status}
    />
  );
}

interface BackendFormData {
  name: string;
  baseUrl: string;
  authToken: string;
  timeoutMs: number;
}

const emptyForm: BackendFormData = {
  name: '',
  baseUrl: '',
  authToken: '',
  timeoutMs: 120000,
};

export default function SettingsPage() {
  const router = useRouter();
  const backends = useBackendStore((s) => s.backends);
  const addBackend = useBackendStore((s) => s.addBackend);
  const updateBackend = useBackendStore((s) => s.updateBackend);
  const removeBackend = useBackendStore((s) => s.removeBackend);
  const setDefault = useBackendStore((s) => s.setDefault);
  const clearAllConversations = useChatStore((s) => s.clearAllConversations);
  const { checkAll } = useBackendHealth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BackendFormData>(emptyForm);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const handleSaveBackend = useCallback(() => {
    if (!formData.name.trim() || !formData.baseUrl.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    if (editingId) {
      updateBackend(editingId, {
        name: formData.name,
        baseUrl: formData.baseUrl,
        authToken: formData.authToken || undefined,
        timeoutMs: formData.timeoutMs,
      });
      toast.success(`Backend "${formData.name}" updated`);
      setEditingId(null);
    } else {
      addBackend({
        name: formData.name,
        baseUrl: formData.baseUrl,
        authToken: formData.authToken || undefined,
        isDefault: backends.length === 0,
        timeoutMs: formData.timeoutMs,
      });
      toast.success(`Backend "${formData.name}" added`);
      setShowAddForm(false);
    }
    setFormData(emptyForm);
    checkAll();
  }, [formData, editingId, backends.length, updateBackend, addBackend, checkAll]);

  const startEdit = useCallback((id: string) => {
    const backend = backends.find((b) => b.id === id);
    if (!backend) return;
    setEditingId(id);
    setShowAddForm(false);
    setFormData({
      name: backend.name,
      baseUrl: backend.baseUrl,
      authToken: backend.authToken || '',
      timeoutMs: backend.timeoutMs,
    });
  }, [backends]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData(emptyForm);
  }, []);

  const handleExport = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      agents: useAgentStore.getState().agents,
      conversations: useChatStore.getState().conversations,
      backends: useBackendStore.getState().backends,
      families: useFamilyStore.getState().families,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentui-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version) {
          toast.error('Invalid export file');
          return;
        }

        if (data.agents && Array.isArray(data.agents)) {
          const agentStore = useAgentStore.getState();
          for (const agent of data.agents) {
            if (!agentStore.getAgent(agent.id)) {
              agentStore.addAgent(agent);
            }
          }
        }

        if (data.families && Array.isArray(data.families)) {
          const familyStore = useFamilyStore.getState();
          for (const family of data.families) {
            if (!familyStore.getFamily(family.id)) {
              familyStore.addFamily(family);
            }
          }
        }

        toast.success('Data imported successfully');
      } catch {
        toast.error('Failed to parse import file');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClearAll = useCallback(() => {
    clearAllConversations();
    setClearDialogOpen(false);
    toast.success('All conversations cleared');
  }, [clearAllConversations]);

  const isFormActive = showAddForm || editingId !== null;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/chat')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Backend Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-5" />
              Backend Configuration
            </CardTitle>
            <CardDescription>
              Manage API backends for your agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {backends.map((backend) => (
              <div
                key={backend.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                {editingId === backend.id ? (
                  <div className="w-full space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Base URL</Label>
                        <Input
                          value={formData.baseUrl}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, baseUrl: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Auth Token</Label>
                        <Input
                          type="password"
                          value={formData.authToken}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, authToken: e.target.value }))
                          }
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label>Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={formData.timeoutMs}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              timeoutMs: parseInt(e.target.value) || 120000,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveBackend}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <HealthDot status={backend.healthStatus} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{backend.name}</span>
                          {backend.isDefault && (
                            <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {backend.baseUrl}
                        </p>
                        {backend.models.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {backend.models.length} model{backend.models.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!backend.isDefault && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setDefault(backend.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => startEdit(backend.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          removeBackend(backend.id);
                          toast.success(`Backend "${backend.name}" removed`);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {showAddForm && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="My Backend"
                    />
                  </div>
                  <div>
                    <Label>Base URL</Label>
                    <Input
                      value={formData.baseUrl}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, baseUrl: e.target.value }))
                      }
                      placeholder="http://localhost:3100/v1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Auth Token</Label>
                    <Input
                      type="password"
                      value={formData.authToken}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, authToken: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Timeout (ms)</Label>
                    <Input
                      type="number"
                      value={formData.timeoutMs}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          timeoutMs: parseInt(e.target.value) || 120000,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveBackend}>
                    Add Backend
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!isFormActive && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAddForm(true);
                  setEditingId(null);
                  setFormData(emptyForm);
                }}
              >
                <Plus className="size-4" />
                Add Backend
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
                <div>
                  <p className="font-medium text-sm">Theme</p>
                  <p className="text-xs text-muted-foreground">
                    {isDark ? 'Dark mode' : 'Light mode'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Switch to {isDark ? 'Light' : 'Dark'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export, import, or clear your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="size-4" />
                Export Data
              </Button>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Import Data
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />

              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="size-4" />
                    Clear Conversations
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="size-5 text-destructive" />
                      Clear all conversations?
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. All conversations and messages
                      will be permanently deleted. Agents and families will not be affected.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleClearAll}>
                      Clear All
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Application:</span>{' '}
                <span className="font-medium">La Famille -- AgentUI</span>
              </p>
              <p>
                <span className="text-muted-foreground">Version:</span>{' '}
                <span className="font-mono">0.1.0</span>
              </p>
              <p className="text-muted-foreground mt-2">
                A ChatGPT-like interface for managing and chatting with your AI agent family.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
