import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Family, FamilyMember } from '@/types/family';
import { generateId } from '@/lib/utils';

interface FamilyState {
  families: Family[];

  addFamily: (family: Omit<Family, 'id' | 'createdAt'>) => string;
  updateFamily: (id: string, updates: Partial<Family>) => void;
  removeFamily: (id: string) => void;
  getFamily: (id: string) => Family | undefined;
  addMember: (familyId: string, member: FamilyMember) => void;
  removeMember: (familyId: string, agentId: string) => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      families: [],

      addFamily: (familyData) => {
        const id = generateId('family');
        const family: Family = {
          ...familyData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ families: [...state.families, family] }));
        return id;
      },

      updateFamily: (id, updates) => {
        set((state) => ({
          families: state.families.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      removeFamily: (id) => {
        set((state) => ({
          families: state.families.filter((f) => f.id !== id),
        }));
      },

      getFamily: (id) => get().families.find((f) => f.id === id),

      addMember: (familyId, member) => {
        set((state) => ({
          families: state.families.map((f) => {
            if (f.id !== familyId) return f;
            // Prevent duplicate members
            if (f.members.some((m) => m.agentId === member.agentId)) return f;
            return { ...f, members: [...f.members, member] };
          }),
        }));
      },

      removeMember: (familyId, agentId) => {
        set((state) => ({
          families: state.families.map((f) => {
            if (f.id !== familyId) return f;
            return {
              ...f,
              members: f.members.filter((m) => m.agentId !== agentId),
            };
          }),
        }));
      },
    }),
    { name: 'agentui-families' }
  )
);
