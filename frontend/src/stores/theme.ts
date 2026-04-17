import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'dark' | 'light';
  toggle: () => void;
  set: (t: 'dark' | 'light') => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggle: () => set((s) => {
        const t = s.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', t);
        return { theme: t };
      }),
      set: (t) => { document.documentElement.setAttribute('data-theme', t); set({ theme: t }); },
    }),
    {
      name: 'rendari.theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) document.documentElement.setAttribute('data-theme', state.theme);
      },
    }
  )
);
