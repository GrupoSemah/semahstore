import { create } from "zustand"

/**
 * @typedef {Object} SheetStore
 * @property {boolean} isOpen - Estado de apertura del panel lateral
 * @property {function(boolean): void} setOpen - Función para cambiar el estado de apertura
 */

/**
 * Hook para controlar el estado del panel lateral
 * @type {SheetStore}
 */
export const useSheetStore = create((set) => ({
  /** @type {boolean} */
  isOpen: false,
  
  /**
   * Cambia el estado de apertura del panel
   * @param {boolean} isOpen - Nuevo estado
   */
  setOpen: (isOpen) => set({ isOpen }),
})) 