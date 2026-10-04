import { create } from "zustand";

export type LifecycleDebugEntry = {
  id: string;
  timestamp: string;
  scope: string;
  event: string;
  details: string | null;
};

type LifecycleDebugState = {
  entries: LifecycleDebugEntry[];
  clearEntries: () => void;
  pushEntry: (entry: Omit<LifecycleDebugEntry, "id" | "timestamp">) => void;
};

const MAX_ENTRIES = 80;

export const useLifecycleDebugStore = create<LifecycleDebugState>((set) => ({
  entries: [],
  clearEntries: () => {
    set({ entries: [] });
  },
  pushEntry: (entry) => {
    set((state) => ({
      entries: [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...state.entries,
      ].slice(0, MAX_ENTRIES),
    }));
  },
}));
