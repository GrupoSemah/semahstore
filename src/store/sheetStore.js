import { create } from "zustand"

export const useSheetStore = create((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
})) 