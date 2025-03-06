import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useCart = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item) => {
        // Check if item has stock
        if (item.stock <= 0) {
          console.error("Cannot add item with no stock")
          return
        }

        const { cart } = get()
        const existingItem = cart.find((cartItem) => cartItem.id === item.id)

        if (existingItem) {
          // Check if we have enough stock for the increased quantity
          if (existingItem.quantity + 1 > item.stock) {
            console.error("Cannot add more items than available in stock")
            return
          }

          const updatedCart = cart.map((cartItem) =>
            cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
          )
          set({ cart: updatedCart })
        } else {
          set({ cart: [...cart, { ...item, quantity: 1 }] })
        }
      },

      removeFromCart: (id) => {
        const { cart } = get()
        set({ cart: cart.filter((item) => item.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        const { cart } = get()
        const item = cart.find((item) => item.id === id)

        // Check if we have enough stock
        if (item && quantity > item.stock) {
          console.error("Cannot add more items than available in stock")
          return
        }

        set({
          cart: cart.map((item) => (item.id === id ? { ...item, quantity } : item)),
        })
      },

      clearCart: () => set({ cart: [] }),

      // Helper to validate cart against current stock
      validateCart: async () => {
        const { cart } = get()
        const invalidItems = []

        // This would typically fetch current stock from the server
        // For now, we'll just check against the stock we have in the cart
        for (const item of cart) {
          if (item.quantity > item.stock) {
            invalidItems.push({
              id: item.id,
              name: item.name,
              requestedQuantity: item.quantity,
              availableStock: item.stock,
            })
          }
        }

        return {
          valid: invalidItems.length === 0,
          invalidItems,
        }
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

