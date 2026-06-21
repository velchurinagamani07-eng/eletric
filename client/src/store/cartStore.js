import { create } from 'zustand'
import { collection, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { db, isFirebaseConfigured } from '../firebase/config'
import { recordServiceView } from '../utils/recommendations'

const storageKey = 'home-electric-cart'
let cartUnsubscribe = null

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

const clearGuestCart = () => {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

const itemId = (item) => String(item.serviceId || item.id || item.slug || item.sku || `item-${Date.now()}`)

const normalizeItem = (service, addons = [], quantity = 1) => {
  const id = itemId(service)
  const price = Number(service.salePrice || service.basePrice || service.price || 0)
  return {
    ...service,
    id,
    serviceId: service.serviceId || id,
    itemType: service.itemType || 'service',
    name: service.name || 'Selected service',
    image: service.image || service.imageURL || service.images?.[0] || '',
    imageURL: service.imageURL || service.image || service.images?.[0] || '',
    price,
    basePrice: price,
    addons,
    quantity: Number(quantity || 1),
    categorySlug: service.categorySlug || service.category || service.categoryId || '',
    addedAt: new Date().toISOString(),
  }
}

const upsertRemoteItem = async (userId, item) => {
  if (!db || !isFirebaseConfigured || !userId) return
  await setDoc(doc(db, 'users', userId, 'cart', item.id), {
    ...item,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

const deleteRemoteItem = async (userId, id) => {
  if (!db || !isFirebaseConfigured || !userId) return
  await deleteDoc(doc(db, 'users', userId, 'cart', id))
}

const persistCart = (userId, items, changedItem) => {
  if (userId && db && isFirebaseConfigured) {
    if (changedItem) upsertRemoteItem(userId, changedItem).catch((error) => toast.error(error.message || 'Cart sync failed.'))
  } else {
    writeCart(items)
  }
}

export const useCartStore = create((set, get) => ({
  items: readCart(),
  loading: false,
  userId: '',

  syncForUser: async (user) => {
    cartUnsubscribe?.()
    cartUnsubscribe = null

    if (!user?.uid || !db || !isFirebaseConfigured) {
      set({ userId: '', items: readCart(), loading: false })
      return
    }

    set({ userId: user.uid, loading: true })
    try {
      const guestItems = readCart()
      if (guestItems.length) {
        await Promise.all(guestItems.map((item) => upsertRemoteItem(user.uid, item)))
        clearGuestCart()
      }

      cartUnsubscribe = onSnapshot(
        collection(db, 'users', user.uid, 'cart'),
        (snapshot) => {
          set({
            items: snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
            loading: false,
          })
        },
        (error) => {
          console.error('Cart sync failed:', error)
          set({ items: guestItems, loading: false })
        },
      )
    } catch (error) {
      console.error('Cart sync failed:', error)
      set({ items: readCart(), loading: false })
    }
  },

  addItem: (service, addons = [], quantity = 1) => {
    const nextItem = normalizeItem(service, addons, quantity)
    if (nextItem.itemType !== 'product') recordServiceView(nextItem)
    set((state) => {
      const exists = state.items.some((item) => item.id === nextItem.id)
      const items = exists
        ? state.items.map((item) => (
          item.id === nextItem.id
            ? { ...item, quantity: Number(item.quantity || 1) + Number(quantity || 1), updatedAt: new Date().toISOString() }
            : item
        ))
        : [...state.items, nextItem]
      const changed = items.find((item) => item.id === nextItem.id)
      persistCart(state.userId, items, changed)
      return { items }
    })
  },

  updateQuantity: (id, newQty) => {
    const quantity = Number(newQty || 0)
    if (quantity < 1) {
      get().removeItem(id)
      return
    }
    set((state) => {
      const items = state.items.map((item) => (item.id === id ? { ...item, quantity, updatedAt: new Date().toISOString() } : item))
      persistCart(state.userId, items, items.find((item) => item.id === id))
      return { items }
    })
  },

  decrementItem: (id) => {
    const current = get().items.find((item) => item.id === id)
    get().updateQuantity(id, Number(current?.quantity || 1) - 1)
  },

  removeItem: (id) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      if (state.userId && db && isFirebaseConfigured) {
        deleteRemoteItem(state.userId, id).catch((error) => toast.error(error.message || 'Cart sync failed.'))
      } else {
        writeCart(items)
      }
      return { items }
    }),

  clear: async () => {
    const { userId } = get()
    if (userId && db && isFirebaseConfigured) {
      const snapshot = await getDocs(collection(db, 'users', userId, 'cart'))
      const batch = writeBatch(db)
      snapshot.forEach((entry) => batch.delete(entry.ref))
      await batch.commit()
    }
    writeCart([])
    set({ items: [] })
  },

  count: () => get().items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
  total: () => get().items.reduce((sum, item) => sum + Number(item.basePrice || item.price || 0) * Number(item.quantity || 1), 0),
}))
