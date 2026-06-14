import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BellRing, ClipboardList, ExternalLink, History, LogOut, Menu, UserRound, X } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuthStore } from '../store/authStore'

const links = [
  { label: 'My Jobs', to: '/worker/dashboard', icon: ClipboardList },
  { label: 'Job History', to: '/worker/history', icon: History },
  { label: 'Notifications', to: '/worker/notifications', icon: BellRing },
  { label: 'Profile', to: '/worker/profile', icon: UserRound },
]

export default function WorkerLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-surface py-6 dark:bg-gray-950 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7">
          <p className="eyebrow">Worker Panel</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy dark:text-white">Assigned service operations</h1>
        </div>
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white p-3 shadow-card dark:border-white/10 dark:bg-gray-900 lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open worker menu"
          >
            <Menu size={21} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-navy dark:text-white">{user?.name || 'Worker'}</p>
            <p className="text-xs font-semibold text-gray-500">Worker account</p>
          </div>
          <Link to="/" className="btn-secondary min-h-11 px-3 py-2 text-xs">
            <ExternalLink size={15} /> Site
          </Link>
        </div>
        <div className="grid gap-5">
          <nav className="hidden gap-2 overflow-x-auto rounded-2xl border border-surface-border bg-white p-2 shadow-card dark:border-white/10 dark:bg-gray-900 lg:flex">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/worker/dashboard'}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-primary text-white shadow-amber'
                        : 'text-gray-500 hover:bg-primary-light hover:text-navy dark:text-gray-300 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} /> {link.label}
                </NavLink>
              )
            })}
            <Link to="/" className="ml-auto flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-primary-light hover:text-navy dark:text-gray-300 dark:hover:bg-white/5">
              <ExternalLink size={18} /> View Website
            </Link>
            <button type="button" className="btn-danger min-h-11 px-4 py-2 text-sm" onClick={() => setConfirmLogout(true)}>
              <LogOut size={17} /> Logout
            </button>
          </nav>
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
                  <p className="text-sm font-black text-navy dark:text-white">{user?.name || 'Worker'}</p>
                  <p className="text-xs font-semibold text-gray-500">{user?.email || user?.mobile || 'Worker account'}</p>
                </div>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10" onClick={() => setDrawerOpen(false)} aria-label="Close worker menu">
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
                      end={link.to === '/worker/dashboard'}
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
      <ConfirmDialog
        open={confirmLogout}
        title={`Log out of ${user?.name || 'worker'} account?`}
        description="You're currently signed in as a Worker.\nYou'll need to sign in again to access your dashboard."
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
