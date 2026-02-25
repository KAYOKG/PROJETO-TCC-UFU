import { create } from "zustand";

const CONSECUTIVE_ERROR_THRESHOLD = 5;

interface ApiErrorState {
  consecutiveErrors: number;
  incrementApiError: () => void;
  resetApiErrorCount: () => void;
  hasTooManyErrors: () => boolean;
}

export const useApiErrorStore = create<ApiErrorState>((set, get) => ({
  consecutiveErrors: 0,

  incrementApiError: () =>
    set((state) => ({ consecutiveErrors: state.consecutiveErrors + 1 })),

  resetApiErrorCount: () => set({ consecutiveErrors: 0 }),

  hasTooManyErrors: () =>
    get().consecutiveErrors >= CONSECUTIVE_ERROR_THRESHOLD,
}));
