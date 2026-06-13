import { create } from 'zustand'

const storageKey = 'home-electric-cart'

const readCart = () => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

const writeCart = (items) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

export const useCartStore = create((set, get) => ({
  items: readCart(),
  addItem: (service) =>
    set((state) => {
      const exists = state.items.some((item) => item.id === service.id)
      const items = exists
        ? state.items.map((item) => (item.id === service.id ? { ...item, quantity: Number(item.quantity || 1) + 1 } : item))
        : [...state.items, { ...service, quantity: 1 }]
      writeCart(items)
      return { items }
    }),
  decrementItem: (serviceId) =>
    set((state) => {
      const items = state.items
        .map((item) => (item.id === serviceId ? { ...item, quantity: Number(item.quantity || 1) - 1 } : item))
        .filter((item) => Number(item.quantity || 0) > 0)
      writeCart(items)
      return { items }
    }),
  removeItem: (serviceId) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== serviceId)
      writeCart(items)
      return { items }
    }),
  clear: () => {
    writeCart([])
    set({ items: [] })
  },
  count: () => get().items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
}))
