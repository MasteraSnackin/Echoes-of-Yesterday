"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ApiKeyStore {
  elevenLabsApiKey: string;
  photoroomApiKey: string;
  setApiKey: (key: keyof Omit<ApiKeyStore, 'setApiKey'>, value: string) => void;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      elevenLabsApiKey: '',
      photoroomApiKey: '',
      setApiKey: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'eo-api-key-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
