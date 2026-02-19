import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APIBackend, HealthStatus } from '@/types/backend';
import { generateId } from '@/lib/utils';

interface BackendState {
  backends: APIBackend[];

  // Actions
  addBackend: (backend: Omit<APIBackend, 'id' | 'healthStatus' | 'models'>) => string;
  updateBackend: (id: string, updates: Partial<APIBackend>) => void;
  removeBackend: (id: string) => void;
  setDefault: (id: string) => void;
  getDefault: () => APIBackend | undefined;
  getBackend: (id: string) => APIBackend | undefined;
  setHealthStatus: (id: string, status: HealthStatus) => void;
  setModels: (id: string, models: string[]) => void;
}

const DEFAULT_BACKEND: APIBackend = {
  id: 'family-api',
  name: 'Family API (OpenClaw)',
  baseUrl: 'http://localhost:3000/v1',
  authToken: 'ZCUjBI188lAxQxNhk3bBrZB76UzZmZwp',
  isDefault: true,
  models: ['maman', 'henry', 'sage', 'nova', 'blaise', 'biblio'],
  healthStatus: 'unknown',
  timeoutMs: 120000,
};

export const useBackendStore = create<BackendState>()(
  persist(
    (set, get) => ({
      backends: [DEFAULT_BACKEND],

      addBackend: (backend) => {
        const id = generateId('backend');
        set((state) => ({
          backends: [
            ...state.backends,
            { ...backend, id, healthStatus: 'unknown' as HealthStatus, models: [] },
          ],
        }));
        return id;
      },

      updateBackend: (id, updates) => {
        set((state) => ({
          backends: state.backends.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      removeBackend: (id) => {
        set((state) => ({
          backends: state.backends.filter((b) => b.id !== id),
        }));
      },

      setDefault: (id) => {
        set((state) => ({
          backends: state.backends.map((b) => ({
            ...b,
            isDefault: b.id === id,
          })),
        }));
      },

      getDefault: () => {
        return get().backends.find((b) => b.isDefault) || get().backends[0];
      },

      getBackend: (id) => {
        return get().backends.find((b) => b.id === id);
      },

      setHealthStatus: (id, status) => {
        set((state) => ({
          backends: state.backends.map((b) =>
            b.id === id ? { ...b, healthStatus: status } : b
          ),
        }));
      },

      setModels: (id, models) => {
        set((state) => ({
          backends: state.backends.map((b) =>
            b.id === id ? { ...b, models } : b
          ),
        }));
      },
    }),
    {
      name: 'agentui-backends',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { backends: APIBackend[] };
        if (version === 0 && state?.backends) {
          // Migrate from gateway (51586) to family-api (3100)
          state.backends = state.backends.map((b) =>
            b.id === 'family-api'
              ? { ...b, baseUrl: DEFAULT_BACKEND.baseUrl, authToken: DEFAULT_BACKEND.authToken }
              : b
          );
        }
        return state;
      },
    }
  )
);
