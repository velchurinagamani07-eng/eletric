import { Helmet } from 'react-helmet-async'
import { Mail, Phone, ShieldCheck, Wrench } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function WorkerProfile() {
  const user = useAuthStore((state) => state.user)
  const initial = (user?.name || user?.email || 'W').slice(0, 1).toUpperCase()

  return (
    <>
      <Helmet>
        <title>Worker Profile | DP Home Electric Services</title>
      </Helmet>
      <section className="card max-w-2xl p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-extrabold text-white shadow-amber">
            {initial}
          </div>
          <div>
            <p className="eyebrow">Profile</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-navy dark:text-white">
              {user?.name || 'Worker'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Verified service worker account</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Info icon={Phone} label="Mobile" value={user?.mobile || 'Not added'} />
          <Info icon={Mail} label="Email" value={user?.email || 'Not added'} />
          <Info icon={ShieldCheck} label="Status" value={user?.status || 'active'} />
          <Info icon={Wrench} label="Panel" value="My Jobs and history" />
        </div>

        <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Profile edits are handled by the admin team to keep worker verification records consistent.
        </p>
      </section>
    </>
  )
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 dark:border-white/10 dark:bg-gray-950">
      <Icon className="text-primary" size={18} />
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-navy dark:text-white">{value}</p>
    </div>
  )
}
