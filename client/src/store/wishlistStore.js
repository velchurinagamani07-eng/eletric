import { create } from 'zustand'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { db, isFirebaseConfigured } from '../firebase/config'

const storageKey = 'home-electric-wishlist'
let wishlistUnsubscribe = null

const readWishlist = () => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

const writeWishlist = (ids) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids))
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

const clearGuestWishlist = () => {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

const serviceId = (service) => String(service.serviceId || service.id || service.slug)

const saveRemoteWishlist = async (userId, service) => {
  if (!db || !isFirebaseConfigured || !userId) return
  const id = serviceId(service)
  await setDoc(doc(db, 'users', userId, 'wishlist', id), {
    serviceId: id,
    name: service.name || 'Saved service',
    image: service.image || service.imageURL || service.images?.[0] || '',
    imageURL: service.imageURL || service.image || service.images?.[0] || '',
    price: Number(service.salePrice || service.basePrice || service.price || 0),
    categorySlug: service.categorySlug || service.category || service.categoryId || '',
    addedAt: serverTimestamp(),
  })
}

export const useWishlistStore = create((set, get) => ({
  ids: readWishlist(),
  userId: '',
  loading: false,

  syncForUser: async (user) => {
    wishlistUnsubscribe?.()
    wishlistUnsubscribe = null

    if (!user?.uid || !db || !isFirebaseConfigured) {
      set({ userId: '', ids: readWishlist(), loading: false })
      return
    }

    set({ userId: user.uid, loading: true })
    try {
      const guestIds = readWishlist()
      if (guestIds.length) {
        await Promise.all(guestIds.map((id) => setDoc(doc(db, 'users', user.uid, 'wishlist', id), {
          serviceId: id,
          addedAt: serverTimestamp(),
        }, { merge: true })))
        clearGuestWishlist()
      }

      wishlistUnsubscribe = onSnapshot(
        collection(db, 'users', user.uid, 'wishlist'),
        (snapshot) => {
          set({ ids: snapshot.docs.map((entry) => entry.id), loading: false })
        },
        (error) => {
          console.error('Wishlist sync failed:', error)
          set({ ids: guestIds, loading: false })
        },
      )
    } catch (error) {
      console.error('Wishlist sync failed:', error)
      set({ ids: readWishlist(), loading: false })
    }
  },

  isInWishlist: (id) => get().ids.includes(String(id)),

  toggleWishlist: (service) => {
    const id = serviceId(service)
    if (!id) return
    set((state) => {
      const active = state.ids.includes(id)
      const ids = active ? state.ids.filter((entry) => entry !== id) : [...state.ids, id]
      if (state.userId && db && isFirebaseConfigured) {
        const action = active
          ? deleteDoc(doc(db, 'users', state.userId, 'wishlist', id))
          : saveRemoteWishlist(state.userId, service)
        action.catch((error) => toast.error(error.message || 'Wishlist sync failed.'))
      } else {
        writeWishlist(ids)
      }
      toast(active ? 'Removed from wishlist.' : 'Added to wishlist.')
      return { ids }
    })
  },
}))
