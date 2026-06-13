import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BellRing,
  ChartNoAxesCombined,
  ClipboardList,
  Gauge,
  Gift,
  PackageSearch,
  CreditCard,
  Settings,
  Smartphone,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'

const links = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Payment Records', to: '/admin/payments', icon: CreditCard },
  { label: 'Customers', to: '/admin/customers', icon: UserRound },
  { label: 'Workers', to: '/admin/workers', icon: Users },
  { label: 'Services', to: '/admin/services', icon: Wrench },
  { label: 'Products', to: '/admin/products', icon: PackageSearch },
  { label: 'Coupons', to: '/admin/coupons', icon: Gift },
  { label: 'Entry Splash', to: '/admin/splash', icon: Sparkles },
  { label: 'Income', to: '/admin/income', icon: ChartNoAxesCombined },
  { label: 'Notifications', to: '/admin/notifications', icon: BellRing },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || false)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      toast.success('Admin app installed.')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice.catch(() => null)
    setInstallPrompt(null)
  }

  return (
    <main className="bg-[#FAFAFA] py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-950 dark:text-white">Platform control center</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-xl border border-[#1E3A5F] bg-[#0F172A] p-3 shadow-sm">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                      isActive
                        ? 'bg-amber-500 text-[#0F172A]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} /> {link.label}
                </NavLink>
              )
            })}
          </aside>
          <Outlet />
        </div>
      </div>
      {installPrompt && !installed && (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-navy-900 shadow-lg transition hover:scale-105"
          onClick={installApp}
          aria-label="Install admin app"
          title="Install admin app"
        >
          <Smartphone size={21} />
        </button>
      )}
    </main>
  )
}
