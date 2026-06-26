import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BellRing,
  ChartNoAxesCombined,
  ClipboardList,
  ExternalLink,
  Gauge,
  Gift,
  LogOut,
  Menu,
  PackageSearch,
  CreditCard,
  Settings,
  Smartphone,
  Sparkles,
  Users,
  Wrench,
  X,
  MessageCircle,
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuthStore } from '../store/authStore'

const links = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Payment Records', to: '/admin/payments', icon: CreditCard },
  { label: 'Enquiries', to: '/admin/enquiries', icon: MessageCircle },
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const roleLabel = user?.role === 'superadmin' ? 'Super Admin' : 'Admin'

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
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-navy"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu size={21} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-navy dark:text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs font-semibold text-gray-500">{roleLabel}</p>
          </div>
          <Link to="/" className="btn-secondary min-h-11 px-3 py-2 text-xs">
            <ExternalLink size={15} /> Site
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="hidden h-fit rounded-xl border border-[#1E3A5F] bg-[#0F172A] p-3 shadow-sm lg:block">
            <AdminNavLinks />
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-black text-white">{user?.name || 'Admin'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-300">{user?.email || user?.mobile || roleLabel}</p>
              <span className="mt-2 inline-flex rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase text-amber-300">
                {roleLabel}
              </span>
              <Link to="/" className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/10">
                <ExternalLink size={14} /> View Website
              </Link>
              <button type="button" className="btn-danger mt-2 min-h-10 w-full px-3 py-2 text-xs" onClick={() => setConfirmLogout(true)}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          </aside>
          <Outlet />
        </div>
      </div>
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              className="flex h-full w-[86vw] max-w-[340px] flex-col overflow-y-auto bg-white shadow-2xl dark:bg-gray-900"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 310, damping: 32 }}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-surface-border p-4 dark:border-white/10">
                <div>
                  <p className="text-sm font-black text-navy dark:text-white">{user?.name || 'Admin'}</p>
                  <p className="text-xs font-semibold text-gray-500">{roleLabel}</p>
                </div>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10" onClick={() => setDrawerOpen(false)} aria-label="Close admin menu">
                  <X size={20} />
                </button>
              </header>
              <nav className="grid gap-1 p-4">
                {links.map((link) => {
                  const Icon = link.icon
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/admin/dashboard'}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-r-2xl border-l-4 px-3 py-3 text-sm font-semibold ${
                          isActive
                            ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
                            : 'border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon size={18} /> {link.label}
                    </NavLink>
                  )
                })}
              </nav>
              <div className="mt-auto border-t border-surface-border p-4 dark:border-white/10">
                <Link to="/" className="btn-secondary w-full" onClick={() => setDrawerOpen(false)}>
                  <ExternalLink size={16} /> View Website
                </Link>
                <button
                  type="button"
                  className="btn-danger mt-3 w-full"
                  onClick={() => {
                    setDrawerOpen(false)
                    setConfirmLogout(true)
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
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
      <ConfirmDialog
        open={confirmLogout}
        title={`Log out of ${user?.name || 'admin'} account?`}
        description={`You're currently signed in as a ${roleLabel}.\nYou'll need to sign in again to access your dashboard.`}
        confirmLabel="Log Out"
        confirmVariant="danger"
        onClose={() => setConfirmLogout(false)}
        onConfirm={async () => {
          await logout()
          setConfirmLogout(false)
          navigate('/')
        }}
      />
    </main>
  )
}

function AdminNavLinks() {
  return links.map((link) => {
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
  })
}
