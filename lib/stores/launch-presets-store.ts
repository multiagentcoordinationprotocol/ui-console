'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LaunchPreset {
  id: string;
  name: string;
  createdAt: string;
  packSlug: string;
  scenarioSlug: string;
  version: string;
  templateId: string;
  mode: 'live' | 'sandbox';
  inputs: Record<string, unknown>;
  tags: string;
  actorId: string;
  runLabel: string;
  contextId?: string;
  extensionKeys?: string;
}

interface LaunchPresetsState {
  presets: LaunchPreset[];
  savePreset(preset: Omit<LaunchPreset, 'id' | 'createdAt'>): void;
  deletePreset(id: string): void;
  renamePreset(id: string, name: string): void;
}

export const useLaunchPresetsStore = create<LaunchPresetsState>()(
  persist(
    (set) => ({
      presets: [],
      savePreset: (preset) =>
        set((state) => ({
          presets: [...state.presets, { ...preset, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
        })),
      deletePreset: (id) => set((state) => ({ presets: state.presets.filter((p) => p.id !== id) })),
      renamePreset: (id, name) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, name } : p))
        }))
    }),
    {
      name: 'macp-ui-launch-presets',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
