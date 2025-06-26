"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface VoiceStore {
  clonedVoiceId: string | null;
  setClonedVoiceId: (id: string | null) => void;
}

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set) => ({
      clonedVoiceId: null,
      setClonedVoiceId: (id) => set({ clonedVoiceId: id }),
    }),
    {
      name: 'eo-voice-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
