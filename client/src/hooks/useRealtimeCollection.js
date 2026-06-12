import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

const EMPTY_ARRAY = Object.freeze([])

export function useRealtimeCollection(collectionName, options = {}, fallback = EMPTY_ARRAY) {
  const filters = options.filters || EMPTY_ARRAY
  const sortBy = options.sortBy
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])
  const sortKey = useMemo(() => JSON.stringify(sortBy || null), [sortBy])
  const [items, setItems] = useState(fallback)
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured))

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setItems(fallback)
        setLoading(false)
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const parsedFilters = JSON.parse(filtersKey)
    const parsedSort = JSON.parse(sortKey)
    const constraints = [
      ...parsedFilters.map(([field, operator, value]) => where(field, operator, value)),
      ...(parsedSort ? [orderBy(parsedSort.field, parsedSort.direction || 'asc')] : []),
    ]
    const ref = query(collection(db, collectionName), ...constraints)
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setItems(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        setLoading(false)
      },
      () => {
        setItems(fallback)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [collectionName, fallback, filtersKey, sortKey])

  return { items, loading }
}
