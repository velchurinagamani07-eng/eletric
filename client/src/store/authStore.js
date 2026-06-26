import { create } from 'zustand'
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config'

const storageKey = 'home-electric-user'
const authReadyTimeoutMs = 8000

const readStoredUser = () => {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const persistUser = (user) => {
  try {
    if (user) window.localStorage.setItem(storageKey, JSON.stringify(user))
    else window.localStorage.removeItem(storageKey)
  } catch {
    // Storage can be unavailable in private contexts.
  }
}

const assertFirebaseAuth = () => {
  if (!auth || !db || !isFirebaseConfigured) {
    throw new Error('Firebase authentication is not configured for this environment.')
  }
}

const panelRoles = new Set(['admin', 'superadmin', 'worker'])
const normalizeRole = (role) => (panelRoles.has(role) ? role : 'unauthorized')

const loadRoleProfile = async (firebaseUser) => {
  assertFirebaseAuth()
  if (!firebaseUser?.uid) throw new Error('Firebase user is missing.')

  const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
  if (!snap.exists()) {
    throw new Error('Account profile was not found. Please contact support.')
  }

  const data = snap.data()
  const role = normalizeRole(data.role)
  if (!panelRoles.has(role)) {
    throw new Error('This account is not authorized for the admin or worker panels.')
  }

  return {
    uid: firebaseUser.uid,
    name: data.name || firebaseUser.displayName || 'HomeElectric Staff',
    email: data.email || firebaseUser.email || '',
    mobile: data.mobile || firebaseUser.phoneNumber || '',
    photoURL: data.photoURL || firebaseUser.photoURL || '',
    role,
    isActive: data.isActive !== false && data.status !== 'suspended',
    status: data.status || (data.isActive === false ? 'suspended' : 'active'),
  }
}

let authUnsubscribe = null
let authReadyTimer = null

export const useAuthStore = create((set, get) => ({
  user: readStoredUser(),
  isLoading: false,
  authReady: !isFirebaseConfigured,

  initAuthListener: () => {
    if (authUnsubscribe || !auth || !isFirebaseConfigured) {
      set((state) => ({ authReady: state.authReady || !isFirebaseConfigured }))
      return () => {}
    }

    authReadyTimer = window.setTimeout(() => {
      authReadyTimer = null
      set((state) => ({
        authReady: true,
        isLoading: false,
        lastError: state.user ? state.lastError : 'Firebase session restore timed out. Please login again.',
      }))
    }, authReadyTimeoutMs)

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (authReadyTimer) {
        window.clearTimeout(authReadyTimer)
        authReadyTimer = null
      }

      if (!firebaseUser) {
        persistUser(null)
        set({ user: null, authReady: true, isLoading: false })
        return
      }

      try {
        const profile = await loadRoleProfile(firebaseUser)
        persistUser(profile)
        set({ user: profile, authReady: true, isLoading: false })
      } catch (error) {
        persistUser(null)
        await signOut(auth).catch(() => {})
        set({ user: null, authReady: true, isLoading: false, lastError: error.message })
      }
    })

    return () => {
      if (authReadyTimer) {
        window.clearTimeout(authReadyTimer)
        authReadyTimer = null
      }
      authUnsubscribe?.()
      authUnsubscribe = null
    }
  },

  setUser: (user) => {
    persistUser(user)
    set({ user, authReady: true, isLoading: false })
  },

  login: async ({ email, password }) => {
    set({ isLoading: true })
    try {
      assertFirebaseAuth()
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const profile = await loadRoleProfile(credential.user)
      persistUser(profile)
      set({ user: profile, isLoading: false, authReady: true })
      return profile
    } catch (error) {
      set({ isLoading: false, authReady: true })
      throw error
    }
  },

  resetPassword: async (email) => {
    assertFirebaseAuth()
    return sendPasswordResetEmail(auth, email)
  },

  updateProfileLocal: async (updates) => {
    const current = get().user
    if (!current?.uid) return null
    const user = { ...current, ...updates }
    persistUser(user)
    set({ user })

    if (db && isFirebaseConfigured && auth?.currentUser?.uid === current.uid) {
      await updateDoc(doc(db, 'users', current.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    }

    return user
  },

  logout: async () => {
    if (auth && isFirebaseConfigured) await signOut(auth)
    persistUser(null)
    set({ user: null, authReady: true, isLoading: false })
  },
}))
