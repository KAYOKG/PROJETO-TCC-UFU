import { create } from "zustand";

export type BlockStatus = "timeout" | "confirmed_threat";

interface BlockState {
  blocked: boolean;
  blockedUntil: string | null;
  reason: string | null;
  status: BlockStatus | null;
  setBlocked: (payload: {
    blockedUntil: string;
    reason: string;
    status: BlockStatus;
  }) => void;
  clearBlocked: () => void;
}

export const useBlockStore = create<BlockState>((set) => ({
  blocked: false,
  blockedUntil: null,
  reason: null,
  status: null,

  setBlocked: (payload) =>
    set({
      blocked: true,
      blockedUntil: payload.blockedUntil,
      reason: payload.reason,
      status: payload.status,
    }),

  clearBlocked: () =>
    set({
      blocked: false,
      blockedUntil: null,
      reason: null,
      status: null,
    }),
}));
