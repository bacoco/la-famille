import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FamilyCreationRequest,
  AgentSpec,
  PipelineLogEntry,
  PipelineStatus,
  PipelineResult,
} from '@/types/genesis';
import { useBackendStore } from './backend-store';
import { useAgentStore } from './agent-store';
import { generateId } from '@/lib/utils';

const MAX_PIPELINE_LOGS = 500;

interface GenesisState {
  // Wizard state
  wizardStep: number;
  familySpec: Partial<FamilyCreationRequest>;

  // Pipeline state
  pipelineId: string | null;
  pipelineStatus: PipelineStatus;
  pipelineLogs: PipelineLogEntry[];
  pipelineResult: PipelineResult | null;

  // SSE abort controller (not persisted)
  _abortController: AbortController | null;

  // Wizard actions
  setWizardStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFamilySpec: (updates: Partial<FamilyCreationRequest>) => void;
  addAgent: (agent: Omit<AgentSpec, '_tempId'>) => void;
  removeAgent: (index: number) => void;
  updateAgent: (index: number, updates: Partial<AgentSpec>) => void;
  moveAgent: (index: number, direction: 'up' | 'down') => void;
  resetWizard: () => void;

  // Pipeline actions
  startPipeline: (genesisUrl: string, token: string) => Promise<void>;
  appendLog: (entry: PipelineLogEntry) => void;
  setPipelineStatus: (status: PipelineStatus) => void;
  abortPipeline: () => void;

  // Post-creation registration
  registerCreatedFamily: () => string | null;
  _registered: boolean;
}

const INITIAL_SPEC: Partial<FamilyCreationRequest> = {
  name: '',
  displayName: '',
  emoji: '',
  description: '',
  agents: [],
  capabilities: [],
  outputs: [],
  schedule: {},
};

export const useGenesisStore = create<GenesisState>()(
  persist(
    (set, get) => ({
      wizardStep: 0,
      familySpec: { ...INITIAL_SPEC },
      pipelineId: null,
      pipelineStatus: 'idle',
      pipelineLogs: [],
      pipelineResult: null,
      _abortController: null,
      _registered: false,

      setWizardStep: (step) => set({ wizardStep: step }),
      nextStep: () => set((s) => ({ wizardStep: Math.min(s.wizardStep + 1, 4) })),
      prevStep: () => set((s) => ({ wizardStep: Math.max(s.wizardStep - 1, 0) })),

      updateFamilySpec: (updates) =>
        set((s) => ({ familySpec: { ...s.familySpec, ...updates } })),

      addAgent: (agent) =>
        set((s) => ({
          familySpec: {
            ...s.familySpec,
            agents: [
              ...(s.familySpec.agents || []),
              { ...agent, _tempId: crypto.randomUUID() },
            ],
          },
        })),

      removeAgent: (index) =>
        set((s) => ({
          familySpec: {
            ...s.familySpec,
            agents: (s.familySpec.agents || []).filter((_, i) => i !== index),
          },
        })),

      updateAgent: (index, updates) =>
        set((s) => ({
          familySpec: {
            ...s.familySpec,
            agents: (s.familySpec.agents || []).map((a, i) =>
              i === index ? { ...a, ...updates } : a
            ),
          },
        })),

      moveAgent: (index, direction) =>
        set((s) => {
          const agents = [...(s.familySpec.agents || [])];
          const targetIdx = direction === 'up' ? index - 1 : index + 1;
          if (targetIdx < 0 || targetIdx >= agents.length) return s;
          [agents[index], agents[targetIdx]] = [agents[targetIdx], agents[index]];
          return { familySpec: { ...s.familySpec, agents } };
        }),

      resetWizard: () => {
        const { _abortController } = get();
        if (_abortController) _abortController.abort();
        set({
          wizardStep: 0,
          familySpec: { ...INITIAL_SPEC },
          pipelineId: null,
          pipelineStatus: 'idle',
          pipelineLogs: [],
          pipelineResult: null,
          _abortController: null,
          _registered: false,
        });
      },

      appendLog: (entry) =>
        set((s) => {
          const logs = [...s.pipelineLogs, entry];
          // Cap at MAX_PIPELINE_LOGS entries
          if (logs.length > MAX_PIPELINE_LOGS) {
            return { pipelineLogs: logs.slice(logs.length - MAX_PIPELINE_LOGS) };
          }
          return { pipelineLogs: logs };
        }),

      setPipelineStatus: (status) => set({ pipelineStatus: status }),

      abortPipeline: () => {
        const { _abortController } = get();
        if (_abortController) _abortController.abort();
        set({ _abortController: null });
      },

      registerCreatedFamily: () => {
        const { familySpec, pipelineResult, pipelineStatus, _registered } = get();
        if (pipelineStatus !== 'complete' || !pipelineResult?.port || _registered) return null;

        const name = familySpec.name || 'unknown';
        const agents = familySpec.agents || [];
        const port = pipelineResult.port;

        // 1. Register backend
        const backendId = `family-${name}`;
        const backendStore = useBackendStore.getState();

        // Don't re-add if already exists
        if (!backendStore.getBackend(backendId)) {
          const modelNames = agents.map((a) => a.name);
          backendStore.addBackend({
            name: `${familySpec.displayName || name} API`,
            baseUrl: `http://localhost:${port}/v1`,
            authToken: '', // User can set this in settings
            isDefault: false,
            timeoutMs: 120000,
          });
          // The addBackend generates a random ID, but we want a predictable one.
          // Update the last-added backend's models.
          const allBackends = useBackendStore.getState().backends;
          const newBackend = allBackends[allBackends.length - 1];
          if (newBackend) {
            backendStore.setModels(newBackend.id, agents.map((a) => a.name));
          }
        }

        // 2. Register agent presets
        const agentStore = useAgentStore.getState();
        const allBackends = useBackendStore.getState().backends;
        const targetBackend = allBackends[allBackends.length - 1];
        const targetBackendId = targetBackend?.id || 'family-api';

        const AGENT_COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#eab308'];

        const presets = agents.map((agent, idx) => ({
          name: agent.name.charAt(0).toUpperCase() + agent.name.slice(1),
          emoji: agent.emoji || '🤖',
          color: AGENT_COLORS[idx % AGENT_COLORS.length],
          model: agent.name,
          creature: agent.role || 'AI agent',
          backendId: targetBackendId,
          description: agent.description || `${agent.name} from ${familySpec.displayName}`,
          systemPrompt: `You are ${agent.name}, a ${agent.role} agent from the ${familySpec.displayName} family.\n\nVibe: ${agent.vibe || 'Professional and helpful.'}`,
          temperature: 0.7,
          maxTokens: 4096,
          personality: {
            vibe: agent.vibe || 'Helpful',
            role: agent.role || 'assistant',
            limitations: 'Follows family policy.',
          },
          isPreset: true,
        }));

        agentStore.initializePresets(presets);

        set({ _registered: true });
        return targetBackendId;
      },

      startPipeline: async (genesisUrl, token) => {
        const { familySpec, _abortController: existingController } = get();

        // Abort any existing connection
        if (existingController) existingController.abort();

        const abortController = new AbortController();

        set({
          pipelineStatus: 'running',
          pipelineLogs: [],
          pipelineResult: null,
          wizardStep: 4,
          _abortController: abortController,
        });

        try {
          // POST to Genesis API
          const res = await fetch(`${genesisUrl}/v1/families/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(familySpec),
            signal: abortController.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
            set({
              pipelineStatus: 'error',
              pipelineResult: { error: err.error?.message || 'Request failed' },
              _abortController: null,
            });
            return;
          }

          const { pipelineId } = await res.json();
          set({ pipelineId });

          // Connect to SSE stream using fetch + manual parsing
          // Use query-param token fallback since fetch SSE can't use EventSource headers
          const sseUrl = `${genesisUrl}/v1/families/pipeline/${pipelineId}?token=${encodeURIComponent(token)}`;
          const sseRes = await fetch(sseUrl, {
            headers: {
              Accept: 'text/event-stream',
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          });

          if (!sseRes.ok || !sseRes.body) {
            set({
              pipelineStatus: 'error',
              pipelineResult: { error: 'Failed to connect to pipeline stream' },
              _abortController: null,
            });
            return;
          }

          const reader = sseRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          // Read SSE stream
          const readStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                // Keep incomplete last line in buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6).trim();
                    if (!jsonStr) continue;
                    try {
                      const data = JSON.parse(jsonStr);

                      if (data.type === 'complete') {
                        set({
                          pipelineStatus: data.status === 'complete' ? 'complete' : 'error',
                          pipelineResult: data.result,
                          _abortController: null,
                        });
                        return;
                      }

                      // Regular log entry
                      get().appendLog(data);
                    } catch {
                      // Skip invalid JSON
                    }
                  }
                }
              }

              // Stream ended without a complete event
              const { pipelineStatus } = get();
              if (pipelineStatus === 'running') {
                set({
                  pipelineStatus: 'error',
                  pipelineResult: { error: 'Connection to pipeline lost' },
                  _abortController: null,
                });
              }
            } catch (err: unknown) {
              // Ignore abort errors
              if (err instanceof DOMException && err.name === 'AbortError') return;
              const { pipelineStatus } = get();
              if (pipelineStatus === 'running') {
                set({
                  pipelineStatus: 'error',
                  pipelineResult: { error: 'Connection to pipeline lost' },
                  _abortController: null,
                });
              }
            }
          };

          // Fire and forget the stream reader, with .catch() guard
          readStream().catch(() => {
            const { pipelineStatus } = get();
            if (pipelineStatus === 'running') {
              set({
                pipelineStatus: 'error',
                pipelineResult: { error: 'Stream reader failed unexpectedly' },
                _abortController: null,
              });
            }
          });
        } catch (err: unknown) {
          // Ignore abort errors
          if (err instanceof DOMException && err.name === 'AbortError') return;
          const message = err instanceof Error ? err.message : 'Unknown error';
          set({
            pipelineStatus: 'error',
            pipelineResult: { error: message },
            _abortController: null,
          });
        }
      },
    }),
    {
      name: 'agentui-genesis',
      partialize: (state) => ({
        pipelineId: state.pipelineId,
        pipelineStatus: state.pipelineStatus,
        pipelineLogs: state.pipelineLogs,
        pipelineResult: state.pipelineResult,
        familySpec: state.familySpec,
        wizardStep: state.wizardStep,
        _registered: state._registered,
      }),
    }
  )
);
