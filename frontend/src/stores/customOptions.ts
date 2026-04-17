import { create } from 'zustand';
import { api } from '../lib/api';

export interface CustomOption { id: string; userId: string; scope: string; value: string; sortOrder: number; active: boolean; usageCount?: number; usageLabel?: string; }

interface State {
  items: CustomOption[];
  loaded: boolean;
  loading: boolean;
  load: (force?: boolean) => Promise<void>;
  add: (scope: string, value: string) => Promise<CustomOption | null>;
  update: (id: string, data: Partial<CustomOption>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byScope: (scope: string) => CustomOption[];
  reset: () => void;
}

export const useCustomOptions = create<State>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  load: async (force = false) => {
    if (get().loaded && !force) return;
    if (get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.get('/user/custom-options');
      set({ items: data, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  add: async (scope, value) => {
    const { data } = await api.post('/user/custom-options', { scope, value });
    // Recarrega para obter usageCount anotado
    await get().load(true);
    return data;
  },
  update: async (id, data) => {
    await api.put(`/user/custom-options/${id}`, data);
    await get().load(true);
  },
  remove: async (id) => {
    await api.delete(`/user/custom-options/${id}`);
    set((s) => ({ items: s.items.filter(i => i.id !== id) }));
  },
  byScope: (scope) => get().items.filter(i => i.scope === scope && i.active),
  reset: () => set({ items: [], loaded: false }),
}));
