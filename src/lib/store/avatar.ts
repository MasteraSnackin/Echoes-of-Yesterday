"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AvatarStore {
  selectedAvatarUri: string | null;
  setSelectedAvatarUri: (uri: string | null) => void;
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set) => ({
      selectedAvatarUri: null,
      setSelectedAvatarUri: (uri) => set({ selectedAvatarUri: uri }),
    }),
    {
      name: 'eo-avatar-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
