import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config'
import { useAuthStore } from '../store/authStore'

const EMPTY_ARRAY = Object.freeze([])

const privateCollections = new Set([
  'users',
  'workers',
  'bookings',
  'payments',
  'notifications',
  'reports',
  'coupons',
  'support_tickets',
  'wallet_transactions',
  'chatbot_unanswered',
])

const toMillis = (value) => {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function normalizeDoc(collectionName, entry) {
  const data = entry.data()
  const item = { ...data, id: entry.id }

  if ((collectionName === 'users' || collectionName === 'workers') && !item.uid) {
    item.uid = entry.id
  }

  return item
}

function sortCollectionItems(items, orderField) {
  if (!orderField) return items
  const sorted = [...items]

  if (orderField === 'order') {
    return sorted.sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
  }

  return sorted.sort((a, b) => toMillis(b[orderField]) - toMillis(a[orderField]))
}

export function useFirestoreCollection(collectionName, fallback = EMPTY_ARRAY, orderField = 'createdAt') {
  const authReady = useAuthStore((state) => state.authReady)
  const storeUser = useAuthStore((state) => state.user)
  const isPrivate = privateCollections.has(collectionName)
  const fallbackKey = JSON.stringify(fallback)
  const stableFallback = useMemo(() => JSON.parse(fallbackKey), [fallbackKey])
  const safeFallback = isPrivate ? EMPTY_ARRAY : stableFallback
  const [items, setItems] = useState(safeFallback)
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured && db))
  const [error, setError] = useState('')

  useEffect(() => {
    const currentFallback = isPrivate ? EMPTY_ARRAY : stableFallback
    const waitingForAuth = isPrivate && !authReady
    const privateWithoutAuth = isPrivate && authReady && !storeUser?.uid && !auth?.currentUser

    if (waitingForAuth) {
      Promise.resolve().then(() => {
        setLoading(true)
        setError('')
      })
      return undefined
    }

    if (!db || !isFirebaseConfigured || privateWithoutAuth) {
      Promise.resolve().then(() => {
        setItems(currentFallback)
        setError(privateWithoutAuth ? 'Login is required to load this data.' : '')
        setLoading(false)
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const fallbackTimer = window.setTimeout(() => {
      setItems(currentFallback)
      setError(isPrivate ? 'Firestore did not respond. No private fallback data was loaded.' : 'Using local fallback data because Firestore did not respond.')
      setLoading(false)
    }, 3500)

    const ref = query(collection(db, collectionName))
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        window.clearTimeout(fallbackTimer)
        const nextItems = sortCollectionItems(
          snapshot.docs.map((entry) => normalizeDoc(collectionName, entry)),
          orderField,
        )
        setItems(nextItems.length ? nextItems : currentFallback)
        setError('')
        setLoading(false)
      },
      (err) => {
        window.clearTimeout(fallbackTimer)
        setError(err.message || `Unable to load ${collectionName}.`)
        setItems(currentFallback)
        setLoading(false)
      },
    )

    return () => {
      window.clearTimeout(fallbackTimer)
      unsubscribe()
    }
  }, [authReady, collectionName, fallbackKey, orderField, isPrivate, stableFallback, storeUser?.uid])

  return { items, setItems, loading, error }
}
