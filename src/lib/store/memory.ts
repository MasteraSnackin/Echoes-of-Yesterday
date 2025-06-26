"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MemoryStore {
  memories: string;
  setMemories: (memories: string) => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set) => ({
      memories: '',
      setMemories: (memories) => set({ memories }),
    }),
    {
      name: 'eo-memory-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
