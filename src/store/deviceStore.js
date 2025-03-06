import { create } from "zustand"

export const useStore = create((set) => ({
  filters: {
    type: "all",
    brand: "all",
    minPrice: "",
    maxPrice: "",
    searchTerm: ""
  },

  setFilters: (newFilters) => 
    set((state) => ({
      filters: typeof newFilters === 'function' 
        ? newFilters(state.filters)
        : { ...state.filters, ...newFilters }
    })),

  updateFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),

  clearFilters: () =>
    set({
      filters: {
        type: "all",
        brand: "all",
        minPrice: "",
        maxPrice: "",
        searchTerm: ""
      }
    })
}))

