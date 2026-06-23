import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalyticsRange } from "@/actions/analytics";

interface MessStore {
  activeMessId: string | null;
  setActiveMessId: (id: string | null) => void;
}

export const useMessStore = create<MessStore>()(
  persist(
    (set) => ({
      activeMessId: null,
      setActiveMessId: (id) => set({ activeMessId: id }),
    }),
    { name: "bornomess-active-mess" }
  )
);

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
  drawerOpen: boolean;
  drawerContent: string | null;
  openDrawer: (content: string) => void;
  closeDrawer: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  drawerOpen: false,
  drawerContent: null,
  openDrawer: (content) => set({ drawerOpen: true, drawerContent: content }),
  closeDrawer: () => set({ drawerOpen: false, drawerContent: null }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));

interface FilterStore {
  analyticsRange: AnalyticsRange;
  setAnalyticsRange: (range: AnalyticsRange) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      analyticsRange: "month",
      setAnalyticsRange: (range) => set({ analyticsRange: range }),
      globalSearch: "",
      setGlobalSearch: (q) => set({ globalSearch: q }),
      recentSearches: [],
      addRecentSearch: (q) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        const next = [trimmed, ...get().recentSearches.filter((s) => s !== trimmed)].slice(0, 8);
        set({ recentSearches: next });
      },
    }),
    { name: "bornomess-filters" }
  )
);
