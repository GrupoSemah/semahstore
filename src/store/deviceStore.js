import { create } from "zustand";


const initialFilters = {
  type: "all",
  brand: "all",
  minPrice: "",
  maxPrice: "",
  searchTerm: ""
};

export const useStore = create((set) => ({
  filters: initialFilters,

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
      filters: initialFilters
    })
}))
