import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Bolt, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const routeForRole = (role) => {
  if (role === 'admin' || role === 'superadmin') return '/admin/dashboard'
  if (role === 'worker') return '/worker/dashboard'
  return '/'
}

const copy = {
  admin: {
    title: 'Admin Login',
    eyebrow: 'Admin Portal',
    description: 'Role-verified access for bookings, enquiries, workers, products, banners and settings.',
    panelTitle: 'Admin access',
    panelSub: 'Use a Firebase account with admin or superadmin role.',
  },
  worker: {
    title: 'Worker Login',
    eyebrow: 'Worker Portal',
    description: 'Check assigned jobs, job history and field notifications.',
    panelTitle: 'Worker access',
    panelSub: 'Use your Firebase worker account created by admin.',
  },
}

export default function PanelLogin({ expectedRoles = null, portal = 'admin' }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const logout = useAuthStore((state) => state.logout)
  const isLoading = useAuthStore((state) => state.isLoading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const text = copy[portal] || copy.admin

  const finishLogin = async (profile) => {
    if (profile.isActive === false || profile.status === 'suspended') {
      navigate('/account-suspended', { replace: true })
      return
    }

    if (expectedRoles?.length && !expectedRoles.includes(profile.role)) {
      await logout()
      throw new Error('This account does not have access to this portal.')
    }

    const returnUrl = params.get('returnUrl')
    navigate(returnUrl || routeForRole(profile.role), { replace: true })
  }

  return (
    <>
      <Helmet>
        <title>{text.title} | DP Home Electric Services</title>
      </Helmet>

      <main className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
        <section className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
            <Link to="/" className="mb-10 inline-flex w-fit items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F59E0B] text-[#0F172A] shadow-[0_4px_14px_rgba(245,158,11,0.35)]">
                <Bolt fill="currentColor" size={24} />
              </span>
              <span>
                <span className="block text-lg font-black text-[#0F172A] dark:text-white">Home Electric</span>
                <span className="block text-xs font-semibold text-[#475569] dark:text-gray-400">Expert Electricians in Tuni</span>
              </span>
            </Link>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">{text.eyebrow}</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold text-[#0F172A] dark:text-white sm:text-5xl">
              {text.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#475569] dark:text-gray-300">{text.description}</p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {['Firebase Auth', 'Role verified', 'Protected panel'].map((item) => (
                <div key={item} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-gray-900">
                  <ShieldCheck className="text-amber-600" size={20} />
                  <p className="mt-3 text-sm font-bold text-[#0F172A] dark:text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center px-5 pb-12 sm:px-8 lg:py-12">
            <section className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-gray-900">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0F172A] dark:text-white">{text.panelTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-gray-300">{text.panelSub}</p>
              </div>

              <form
                className="mt-6 grid gap-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  try {
                    const profile = await login({ email, password })
                    await finishLogin(profile)
                    toast.success(`Logged in as ${profile.role}`)
                  } catch (error) {
                    toast.error(error.message || 'Unable to login.')
                  }
                }}
              >
                <label>
                  <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Email</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input className="field min-h-12 pl-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                  </div>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      className="field min-h-12 pl-11 pr-10"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                <button
                  type="button"
                  className="w-fit text-sm font-semibold text-amber-700 hover:text-amber-600"
                  onClick={async () => {
                    try {
                      await resetPassword(email)
                      toast.success('Password reset email sent.')
                    } catch (error) {
                      toast.error(error.message || 'Unable to send reset email.')
                    }
                  }}
                >
                  Forgot Password?
                </button>
                <button type="submit" className="btn-primary w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Login'}
                </button>
              </form>
            </section>
          </div>
        </section>
      </main>
    </>
  )
}
