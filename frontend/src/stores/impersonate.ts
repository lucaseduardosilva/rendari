import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BackupAuth {
  user: any;
  accessToken: string;
  refreshToken: string;
}

interface State {
  backup: BackupAuth | null;
  set: (b: BackupAuth | null) => void;
  clear: () => void;
}

export const useImpersonate = create<State>()(
  persist(
    (set) => ({
      backup: null,
      set: (b) => set({ backup: b }),
      clear: () => set({ backup: null }),
    }),
    { name: 'rendari.impersonate' }
  )
);
