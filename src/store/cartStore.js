import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * @typedef {Object} Device
 * @property {string} id - ID único del dispositivo
 * @property {string} name - Nombre del dispositivo
 * @property {string} description - Descripción del dispositivo
 * @property {number} price - Precio del dispositivo
 * @property {string} brand - Marca del dispositivo
 * @property {string} type - Tipo de dispositivo
 * @property {string} image - URL de la imagen del dispositivo
 * @property {number} stock - Stock disponible
 */

/**
 * @typedef {Device & { quantity: number }} CartItem
 */

/**
 * @typedef {Object} InvalidStockItem
 * @property {string} id - ID del item
 * @property {string} name - Nombre del item
 * @property {number} requestedQuantity - Cantidad solicitada
 * @property {number} availableStock - Stock disponible
 */

/**
 * @typedef {Object} CartValidationResult
 * @property {boolean} valid - Si el carrito es válido
 * @property {InvalidStockItem[]} invalidItems - Items con problemas de stock
 */

/**
 * @typedef {Object} CartStore
 * @property {CartItem[]} cart - Items en el carrito
 * @property {function(Device): void} addToCart - Añade un item al carrito
 * @property {function(string): void} removeFromCart - Elimina un item del carrito
 * @property {function(string, number): void} updateQuantity - Actualiza la cantidad de un item
 * @property {function(): void} clearCart - Limpia el carrito
 * @property {function(): Promise<CartValidationResult>} validateCart - Valida el carrito contra el stock
 */

/** @type {import("zustand").StateCreator<CartStore>} */
const createCartStore = (set, get) => ({
  /** @type {CartItem[]} */
  cart: [],

  /**
   * Añade un producto al carrito
   * @param {Device} item - Producto a añadir
   */
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

  /**
   * Elimina un producto del carrito
   * @param {string} id - ID del producto a eliminar
   */
  removeFromCart: (id) => {
    const { cart } = get()
    set({ cart: cart.filter((item) => item.id !== id) })
  },

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {string} id - ID del producto a actualizar
   * @param {number} quantity - Nueva cantidad
   */
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

  /** Limpia el carrito */
  clearCart: () => set({ cart: [] }),

  /**
   * Valida el carrito contra el stock actual
   * @returns {Promise<CartValidationResult>} Resultado de la validación
   */
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
})

/**
 * Hook para gestionar el carrito de compras
 * @type {CartStore}
 */
export const useCart = create(
  persist(
    createCartStore,
    {
      name: "cart-storage",
    }
  )
)

