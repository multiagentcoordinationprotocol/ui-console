'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppPreferences } from '@/lib/types';

interface PreferencesState extends AppPreferences {
  setTheme(theme: AppPreferences['theme']): void;
  toggleTheme(): void;
  setDemoMode(value: boolean): void;
  setAutoFollow(value: boolean): void;
  setShowCriticalPath(value: boolean): void;
  setShowParallelBranches(value: boolean): void;
  setReplaySpeed(value: number): void;
  setLogsDensity(value: AppPreferences['logsDensity']): void;
  setDesignVersion(value: AppPreferences['designVersion']): void;
}

const defaultPreferences: AppPreferences = {
  theme: 'dark',
  demoMode: process.env.NEXT_PUBLIC_MACP_UI_DEMO_MODE !== 'false',
  autoFollow: true,
  showCriticalPath: true,
  showParallelBranches: true,
  replaySpeed: 1,
  logsDensity: 'comfortable',
  // R7.3 — v2 is now the default. Users can opt out via `?design=v1` (URL
  // override writes back to this store) for emergency rollback. The flag
  // and the `data-design` attribute stay in place; remove them in a
  // follow-up once v2 is stable in production (plan R7.3 final step).
  designVersion: 'v2'
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setDemoMode: (demoMode) => set({ demoMode }),
      setAutoFollow: (autoFollow) => set({ autoFollow }),
      setShowCriticalPath: (showCriticalPath) => set({ showCriticalPath }),
      setShowParallelBranches: (showParallelBranches) => set({ showParallelBranches }),
      setReplaySpeed: (replaySpeed) => set({ replaySpeed }),
      setLogsDensity: (logsDensity) => set({ logsDensity }),
      setDesignVersion: (designVersion) => set({ designVersion })
    }),
    {
      name: 'macp-ui-preferences',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
