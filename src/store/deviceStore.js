import { create } from "zustand";

/**
 * @typedef {Object} DeviceFilters
 * @property {string} type - Tipo de dispositivo
 * @property {string} brand - Marca del dispositivo
 * @property {string} minPrice - Precio mínimo (como string para el input)
 * @property {string} maxPrice - Precio máximo (como string para el input)
 * @property {string} searchTerm - Término de búsqueda
 */

/**
 * @typedef {Object} DeviceStore
 * @property {DeviceFilters} filters - Filtros actuales
 * @property {function(Object|function):void} setFilters - Establece los filtros
 * @property {function(string, string):void} updateFilter - Actualiza un filtro específico
 * @property {function():void} clearFilters - Limpia todos los filtros
 */

/** @type {DeviceFilters} */
const initialFilters = {
  type: "all",
  brand: "all",
  minPrice: "",
  maxPrice: "",
  searchTerm: ""
};

/** @type {DeviceStore} */
export const useStore = create((set) => ({
  filters: initialFilters,

  /**
   * Establece los filtros
   * @param {Object|function} newFilters - Nuevos filtros o función para actualizar
   */
  setFilters: (newFilters) => 
    set((state) => ({
      filters: typeof newFilters === 'function' 
        ? newFilters(state.filters)
        : { ...state.filters, ...newFilters }
    })),

  /**
   * Actualiza un filtro específico
   * @param {string} key - Clave del filtro a actualizar
   * @param {string} value - Valor del filtro
   */
  updateFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),

  /**
   * Limpia todos los filtros a sus valores iniciales
   */
  clearFilters: () =>
    set({
      filters: initialFilters
    })
}))
