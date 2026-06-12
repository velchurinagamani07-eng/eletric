import { create } from 'zustand'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase/config'

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

const normalizeRole = (role) => (role === 'customer' ? 'user' : role || 'user')

const loadRoleProfile = async (firebaseUser) => {
  assertFirebaseAuth()
  if (!firebaseUser?.uid) throw new Error('Firebase user is missing.')

  const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
  if (!snap.exists()) {
    throw new Error('Account profile was not found. Please contact support.')
  }

  const data = snap.data()
  return {
    uid: firebaseUser.uid,
    name: data.name || firebaseUser.displayName || 'HomeElectric User',
    email: data.email || firebaseUser.email || '',
    mobile: data.mobile || firebaseUser.phoneNumber || '',
    photoURL: data.photoURL || firebaseUser.photoURL || '',
    role: normalizeRole(data.role),
    isActive: data.isActive !== false && data.status !== 'suspended',
    status: data.status || (data.isActive === false ? 'suspended' : 'active'),
    addressBook: data.addressBook || [],
    birthday: data.birthday || '',
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

  googleLogin: async () => {
    set({ isLoading: true })
    try {
      assertFirebaseAuth()
      if (!googleProvider) throw new Error('Google sign-in is not configured.')

      const credential = await signInWithPopup(auth, googleProvider)
      const userRef = doc(db, 'users', credential.user.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        await setDoc(userRef, {
          name: credential.user.displayName || 'Google User',
          email: credential.user.email || '',
          mobile: credential.user.phoneNumber || '',
          photoURL: credential.user.photoURL || '',
          role: 'user',
          isActive: true,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      const profile = await loadRoleProfile(credential.user)
      if (profile.role !== 'user') {
        await signOut(auth).catch(() => {})
        throw new Error('Google sign-in is available for customer accounts only.')
      }

      persistUser(profile)
      set({ user: profile, isLoading: false, authReady: true })
      return profile
    } catch (error) {
      set({ isLoading: false, authReady: true })
      throw error
    }
  },

  register: async ({ name, mobile, email, password }) => {
    set({ isLoading: true })
    try {
      assertFirebaseAuth()
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: name })
      const profile = {
        uid: credential.user.uid,
        name,
        mobile,
        email,
        photoURL: '',
        role: 'user',
        isActive: true,
        status: 'active',
        addressBook: [],
        birthday: '',
      }
      await setDoc(doc(db, 'users', credential.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
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
