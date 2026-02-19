import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, AgentCreate } from '@/types/agent';
import { generateId } from '@/lib/utils';

interface AgentState {
  agents: Agent[];

  // Actions
  addAgent: (agent: AgentCreate) => string;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  getAgent: (id: string) => Agent | undefined;
  getAgentsByBackend: (backendId: string) => Agent[];
  initializePresets: (presets: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],

      addAgent: (agentData) => {
        const id = generateId('agent');
        const now = new Date().toISOString();
        const agent: Agent = {
          ...agentData,
          id,
          isPreset: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ agents: [...state.agents, agent] }));
        return id;
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id
              ? { ...a, ...updates, updatedAt: new Date().toISOString() }
              : a
          ),
        }));
      },

      removeAgent: (id) => {
        const agent = get().agents.find((a) => a.id === id);
        if (agent?.isPreset) return; // Cannot delete preset agents
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }));
      },

      getAgent: (id) => get().agents.find((a) => a.id === id),

      getAgentsByBackend: (backendId) =>
        get().agents.filter((a) => a.backendId === backendId),

      initializePresets: (presets) => {
        const existing = get().agents;
        const existingPresetNames = new Set(
          existing.filter((a) => a.isPreset).map((a) => a.name)
        );
        const now = new Date().toISOString();
        const newPresets: Agent[] = presets
          .filter((p) => !existingPresetNames.has(p.name))
          .map((p) => ({
            ...p,
            id: generateId('agent'),
            createdAt: now,
            updatedAt: now,
          }));
        if (newPresets.length > 0) {
          set((state) => ({ agents: [...state.agents, ...newPresets] }));
        }
      },
    }),
    { name: 'agentui-agents' }
  )
);
