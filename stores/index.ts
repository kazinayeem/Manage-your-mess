import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    { name: "messflow-active-mess" }
  )
);

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
