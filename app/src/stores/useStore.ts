"use client";

import { create } from "zustand";
import type {
  DedicationInput,
  Generation,
  GenerationStatus,
  Mood,
  Genre,
  Language,
  VoiceType,
  Occasion,
  Relationship,
} from "@/types";

interface DhunStore {
  // User
  coins: number;
  isFirstTime: boolean;
  adUnlocksToday: number;
  adUnlockDate: string; // YYYY-MM-DD
  setCoins: (coins: number) => void;
  setIsFirstTime: (value: boolean) => void;
  deductCoins: (amount: number) => boolean;
  addCoins: (amount: number) => void;
  useAdUnlock: () => boolean; // returns false if 5/day limit reached
  getAdUnlocksRemaining: () => number;

  // Dedication form
  dedication: DedicationInput;
  setRecipientName: (name: string) => void;
  setOccasion: (occasion: Occasion) => void;
  setRelationship: (relationship: Relationship) => void;
  setMessage: (message: string) => void;
  setMood: (mood: Mood) => void;
  setGenre: (genre: Genre) => void;
  setLanguage: (language: Language) => void;
  setVoice: (voice: VoiceType) => void;
  resetDedication: () => void;

  // Generation
  currentGeneration: Generation | null;
  generationStatus: GenerationStatus;
  setCurrentGeneration: (gen: Generation | null) => void;
  setGenerationStatus: (status: GenerationStatus) => void;

  // Library
  generations: Generation[];
  addGeneration: (gen: Generation) => void;

  // UI
  step: number;
  setStep: (step: number) => void;
}

const DEFAULT_DEDICATION: DedicationInput = {
  recipientName: "",
  occasion: "love",
  relationship: "partner",
  message: "",
  mood: "romantic",
  genre: "bollywood",
  language: "hinglish",
  voice: "female",
};

export const useStore = create<DhunStore>((set, get) => ({
  // User
  coins: 20, // Free onboarding coins
  isFirstTime: true,
  adUnlocksToday: 0,
  adUnlockDate: new Date().toISOString().split("T")[0],
  setCoins: (coins) => set({ coins }),
  setIsFirstTime: (value) => set({ isFirstTime: value }),
  deductCoins: (amount) => {
    const { coins } = get();
    if (coins < amount) return false;
    set({ coins: coins - amount });
    return true;
  },
  addCoins: (amount) => set({ coins: get().coins + amount }),
  useAdUnlock: () => {
    const today = new Date().toISOString().split("T")[0];
    const { adUnlockDate, adUnlocksToday } = get();
    const count = adUnlockDate === today ? adUnlocksToday : 0;
    if (count >= 5) return false;
    set({ adUnlocksToday: count + 1, adUnlockDate: today });
    return true;
  },
  getAdUnlocksRemaining: () => {
    const today = new Date().toISOString().split("T")[0];
    const { adUnlockDate, adUnlocksToday } = get();
    return adUnlockDate === today ? 5 - adUnlocksToday : 5;
  },

  // Dedication form
  dedication: { ...DEFAULT_DEDICATION },
  setRecipientName: (name) =>
    set((s) => ({ dedication: { ...s.dedication, recipientName: name } })),
  setOccasion: (occasion) =>
    set((s) => ({ dedication: { ...s.dedication, occasion } })),
  setRelationship: (relationship) =>
    set((s) => ({ dedication: { ...s.dedication, relationship } })),
  setMessage: (message) =>
    set((s) => ({ dedication: { ...s.dedication, message } })),
  setMood: (mood) =>
    set((s) => ({ dedication: { ...s.dedication, mood } })),
  setGenre: (genre) =>
    set((s) => ({ dedication: { ...s.dedication, genre } })),
  setLanguage: (language) =>
    set((s) => ({ dedication: { ...s.dedication, language } })),
  setVoice: (voice) =>
    set((s) => ({ dedication: { ...s.dedication, voice } })),
  resetDedication: () => set({ dedication: { ...DEFAULT_DEDICATION }, step: 0 }),

  // Generation
  currentGeneration: null,
  generationStatus: "idle",
  setCurrentGeneration: (gen) => set({ currentGeneration: gen }),
  setGenerationStatus: (status) => set({ generationStatus: status }),

  // Library
  generations: [],
  addGeneration: (gen) =>
    set((s) => ({ generations: [gen, ...s.generations] })),

  // UI
  step: 0,
  setStep: (step) => set({ step }),
}));
