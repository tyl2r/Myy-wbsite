'use client';

import { create } from 'zustand';

/** Ephemeral UI state: sidebar collapse and command-palette visibility. */
interface UiState {
  sidebarOpen: boolean;
  paletteOpen: boolean;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  setPalette: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  sidebarOpen: false,
  paletteOpen: false,
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPalette: (open) => set({ paletteOpen: open }),
}));
