import { create } from 'zustand';

interface ProfileState {
  profile: any | null;
  history: any[];
  isLoading: boolean;
  setProfile: (profile: any) => void;
  setHistory: (history: any[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  history: [],
  isLoading: false,
  setProfile: (profile) => set({ profile }),
  setHistory: (history) => set({ history }),
  setLoading: (isLoading) => set({ isLoading }),
}));
