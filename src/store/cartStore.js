import { create } from "zustand"
import { persist } from "zustand/middleware"

const createCartStore = (set, get) => ({
  cart: [],

  addToCart: (item) => {
    if (item.stock <= 0) {
      console.error("Cannot add item with no stock")
      return
    }

    const { cart } = get()
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)

    if (existingItem) {
      if (existingItem.quantity + 1 > item.stock) {
        console.error("Cannot add more items than available in stock")
        return
      }

      const updatedCart = cart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
      )
      set({ cart: updatedCart })
    } else {
      // Aplicar descuento del 50% automáticamente
      const discountedPrice = item.price * 0.5
      set({ cart: [...cart, { ...item, price: discountedPrice, originalPrice: item.price, quantity: 1 }] })
    }
  },


  removeFromCart: (id) => {
    const { cart } = get()
    set({ cart: cart.filter((item) => item.id !== id) })
  },


  updateQuantity: (id, quantity) => {
    const { cart } = get()
    const item = cart.find((cartItem) => cartItem.id === id)

    if (!item) {
      console.error("Item not found in cart")
      return
    }

    // Validar que la cantidad no exceda el stock disponible
    if (quantity > item.stock) {
      console.error("Cannot add more items than available in stock")
      return
    }

    // Asegurar que la cantidad sea al menos 1
    const validQuantity = Math.max(1, quantity)

    set({
      cart: cart.map((cartItem) => 
        cartItem.id === id ? { ...cartItem, quantity: validQuantity } : cartItem
      ),
    })
  },

  clearCart: () => set({ cart: [] }),

  validateCart: async () => {
    const { cart } = get()
    const invalidItems = []

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
})

export const useCart = create(
  persist(
    createCartStore,
    {
      name: "cart-storage",
    }
  )
)

