import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Bolt, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })

  const errors = useMemo(() => {
    const next = {}
    if (form.name && form.name.length < 2) next.name = 'Enter a valid full name.'
    if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile)) next.mobile = 'Enter a valid 10-digit mobile number.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email.'
    if (form.password && form.password.length < 6) next.password = 'Use at least 6 characters.'
    if (form.confirmPassword && form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    return next
  }, [form])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <>
      <Helmet>
        <title>Register | Home Electric Services</title>
      </Helmet>

      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
        <section className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-gray-900">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-gray-950">
              <Bolt fill="currentColor" size={24} />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-gray-950 dark:text-white">Create customer account</h1>
            <p className="mt-2 text-sm text-gray-500">Google sign-in and registration are for customers only.</p>
          </div>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault()
              if (Object.keys(errors).length || !form.terms) {
                toast.error('Please fix the highlighted fields.')
                return
              }
              try {
                await register(form)
                toast.success('Welcome to Home Electric Services.')
                navigate('/dashboard')
              } catch (error) {
                toast.error(error.message || 'Registration failed.')
              }
            }}
          >
            {[
              ['name', 'Full Name', 'text'],
              ['mobile', 'Mobile Number', 'tel'],
              ['email', 'Email', 'email'],
              ['password', 'Password', 'password'],
              ['confirmPassword', 'Confirm Password', 'password'],
            ].map(([field, label, type]) => (
              <label key={field} className={field === 'confirmPassword' ? 'sm:col-span-2' : ''}>
                <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                <input
                  className={`field ${errors[field] ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  type={type}
                  value={form[field]}
                  onChange={(event) => update(field, event.target.value)}
                  required
                />
                {errors[field] && <span className="mt-1 block text-xs font-semibold text-red-500">{errors[field]}</span>}
              </label>
            ))}
            <label className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-amber-500"
                checked={form.terms}
                onChange={(event) => update('terms', event.target.checked)}
              />
              <span>I agree to service terms, warranty rules, and privacy policy.</span>
            </label>
            <button type="submit" className="btn-primary sm:col-span-2">
              <CheckCircle2 size={18} /> Register
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-amber-700 hover:text-amber-600">
              Login
            </Link>
          </p>
        </section>
      </main>
    </>
  )
}

