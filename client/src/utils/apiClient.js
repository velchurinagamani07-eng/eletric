import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'

const authReadyTimeoutMs = 8000

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
}

function buildApiUrl(baseURL, path) {
  return `${baseURL.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`
}

function waitForSignedInUser() {
  if (!auth || !isFirebaseConfigured) {
    return Promise.reject(new Error('Firebase authentication is not configured for this environment.'))
  }

  if (auth.currentUser) return Promise.resolve(auth.currentUser)

  return new Promise((resolve, reject) => {
    let unsubscribe = null
    const timer = window.setTimeout(() => {
      unsubscribe?.()
      reject(new Error('Please login again. Firebase session is not ready.'))
    }, authReadyTimeoutMs)

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        window.clearTimeout(timer)
        unsubscribe?.()
        if (user) resolve(user)
        else reject(new Error('Please login again before continuing.'))
      },
      (error) => {
        window.clearTimeout(timer)
        unsubscribe?.()
        reject(error)
      },
    )
  })
}

export async function getFirebaseIdToken({ forceRefresh = false } = {}) {
  const user = await waitForSignedInUser()
  const token = await user.getIdToken(forceRefresh)
  if (!token) throw new Error('Firebase ID token could not be generated. Please login again.')
  return token
}

export async function getAuthHeaders(headers = {}) {
  const token = await getFirebaseIdToken()
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  }
}

export async function apiFetch(path, options = {}) {
  const baseURL = getApiBaseUrl()
  if (!baseURL) throw new Error('API URL is not configured.')

  const { headers = {}, authRequired = true, ...fetchOptions } = options
  const nextHeaders = authRequired ? await getAuthHeaders(headers) : headers

  return fetch(buildApiUrl(baseURL, path), {
    ...fetchOptions,
    headers: nextHeaders,
  })
}

export async function apiJson(path, { body, headers = {}, ...options } = {}) {
  const response = await apiFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Request failed.')
  return data
}
