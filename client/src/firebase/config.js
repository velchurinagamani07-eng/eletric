import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, onSnapshot as firebaseOnSnapshot } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Firebase Auth must include the production domain in Authorized domains.
// Public customers do not sign in; only admin and worker email/password auth is used.

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp
  ? (() => {
      try {
        return initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          forceLongPolling: true,
        })
      } catch {
        return getFirestore(firebaseApp)
      }
    })()
  : null
export const storage = firebaseApp ? getStorage(firebaseApp) : null

export const messagingPromise = firebaseApp
  ? isSupported().then((supported) => (supported ? getMessaging(firebaseApp) : null))
  : Promise.resolve(null)

export function onSnapshotWithRetry(queryOrDocRef, onNext, onError) {
  let unsubscribe = null
  let timeoutId = null
  let delay = 2000
  let isUnsubscribed = false

  function startListening() {
    if (isUnsubscribed) return

    try {
      unsubscribe = firebaseOnSnapshot(
        queryOrDocRef,
        (snapshot) => {
          delay = 2000
          if (onNext) onNext(snapshot)
        },
        (error) => {
          console.error("Firestore onSnapshot error, retrying...", error)
          if (onError) {
            try {
              onError(error)
            } catch (err) {
              console.error("Error in snapshot listener error callback:", err)
            }
          }

          if (!isUnsubscribed) {
            if (unsubscribe) {
              try {
                unsubscribe()
              } catch (e) {}
            }
            timeoutId = setTimeout(() => {
              delay = Math.min(delay * 2, 30000)
              startListening()
            }, delay)
          }
        }
      )
    } catch (error) {
      console.error("Firestore onSnapshot sync error, retrying...", error)
      if (onError) {
        try {
          onError(error)
        } catch (err) {}
      }

      if (!isUnsubscribed) {
        timeoutId = setTimeout(() => {
          delay = Math.min(delay * 2, 30000)
          startListening()
        }, delay)
      }
    }
  }

  startListening()

  return () => {
    isUnsubscribed = true
    if (timeoutId) clearTimeout(timeoutId)
    if (unsubscribe) {
      try {
        unsubscribe()
      } catch (e) {}
    }
  }
}
