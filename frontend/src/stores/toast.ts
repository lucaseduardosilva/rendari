import { create } from 'zustand';

type ToastKind = 'info' | 'success' | 'warn' | 'error';

interface ToastItem { id: number; message: string; kind: ToastKind }

interface ToastState {
  items: ToastItem[];
  show: (message: string, kind?: ToastKind, ttl?: number) => void;
  remove: (id: number) => void;
}

export const useToast = create<ToastState>((set, get) => ({
  items: [],
  show: (message, kind = 'info', ttl = 3000) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, message, kind }] }));
    setTimeout(() => get().remove(id), ttl);
  },
  remove: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
}));

export const toast = (msg: string, kind: ToastKind = 'info', ttl = 3000) => useToast.getState().show(msg, kind, ttl);
