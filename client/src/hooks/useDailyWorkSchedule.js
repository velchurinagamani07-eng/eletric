import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { createFallbackDailyWork, getLocalDateKey, normalizeDailyWork } from '../utils/dailyWork'

export function useDailyWorkSchedule(dateKey = getLocalDateKey()) {
  const [schedule, setSchedule] = useState(() => createFallbackDailyWork(dateKey))
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))
  const [error, setError] = useState('')

  useEffect(() => {
    const fallback = createFallbackDailyWork(dateKey)

    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setSchedule(fallback)
        setLoading(false)
        setError('')
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const fallbackTimer = window.setTimeout(() => {
      setSchedule(fallback)
      setLoading(false)
      setError('Using local schedule until Firestore responds.')
    }, 3500)

    const unsubscribe = onSnapshot(
      doc(db, 'daily_work', dateKey),
      (snapshot) => {
        window.clearTimeout(fallbackTimer)
        setSchedule(snapshot.exists() ? normalizeDailyWork({ ...snapshot.data(), id: snapshot.id }, dateKey) : fallback)
        setError('')
        setLoading(false)
      },
      (err) => {
        window.clearTimeout(fallbackTimer)
        setSchedule(fallback)
        setError(err.message || 'Unable to load daily work.')
        setLoading(false)
      },
    )

    return () => {
      window.clearTimeout(fallbackTimer)
      unsubscribe()
    }
  }, [dateKey])

  return { schedule, loading, error, setSchedule }
}
