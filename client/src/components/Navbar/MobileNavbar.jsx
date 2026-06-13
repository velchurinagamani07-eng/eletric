import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgePercent,
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  HelpCircle,
  Home,
  Info,
  LogIn,
  LogOut,
  Menu,
  PackageSearch,
  Phone,
  Settings,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { settings } from '../../data/catalog'
import { useAuthStore } from '../../store/authStore'

const sparkParticles = [
  { x: -16, y: -12 },
  { x: 18, y: -10 },
  { x: 0, y: -22 },
]

const browseLinks = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Services', to: '/services', icon: Settings },
  { label: 'Products', to: '/products', icon: PackageSearch },
  { label: 'About', to: '/about', icon: Info },
  { label: 'Contact', to: '/contact', icon: Phone },
  { label: 'FAQ', to: '/faq', icon: HelpCircle },
]

const accountLinks = [
  { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarDays },
  { label: 'My Orders', to: '/dashboard', icon: PackageSearch },
  { label: 'My Coupons', to: '/dashboard/coupons', icon: BadgePercent },
  { label: 'Profile Settings', to: '/dashboard/profile', icon: UserRound },
]

export default function MobileNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isHome = location.pathname === '/'
  const firstName = user?.name?.split(' ')?.[0] || ''
  const profileTo = user ? '/dashboard/profile' : `/login?returnUrl=${encodeURIComponent('/dashboard/profile')}`

  const closeAndGo = (to) => {
    setDrawerOpen(false)
    navigate(to)
  }

  return (
    <>
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
              className="ml-auto flex h-full w-[85vw] max-w-[340px] flex-col overflow-y-auto bg-white shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 310, damping: 32 }}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-surface-border px-4 py-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
                <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 font-display text-sm font-extrabold text-navy">
                  <Zap className="text-primary" size={19} fill="currentColor" /> {settings.shortName}
                </Link>
              </header>

              <section className="border-b border-surface-border px-4 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-extrabold text-white">
                    {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : (user?.name || 'G').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-navy">{user?.name || 'Guest User'}</p>
                    <p className="text-xs text-gray-500">{user?.mobile || user?.email || 'Login to manage bookings'}</p>
                    <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                      {user?.role || 'guest'}
                    </span>
                  </div>
                </div>
              </section>

              <DrawerSection title="Browse" links={browseLinks} onGo={closeAndGo} />
              <DrawerSection title="My Account" links={accountLinks} onGo={closeAndGo} disabled={!user} />

              {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'worker') && (
                <section className="border-t border-surface-border px-4 py-4">
                  {user?.role === 'admin' || user?.role === 'superadmin' ? (
                    <button type="button" className="drawer-link" onClick={() => closeAndGo('/admin/dashboard')}>
                      <CircleUserRound size={18} /> Admin Panel
                    </button>
                  ) : (
                    <button type="button" className="drawer-link" onClick={() => closeAndGo('/worker/jobs')}>
                      <BriefcaseBusiness size={18} /> My Jobs
                    </button>
                  )}
                </section>
              )}

              <div className="mt-auto border-t border-surface-border p-4">
                {user ? (
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600"
                    onClick={async () => {
                      await logout()
                      setDrawerOpen(false)
                      navigate('/login')
                    }}
                  >
                    <LogOut size={17} /> Logout
                  </button>
                ) : (
                  <button type="button" className="btn-primary w-full" onClick={() => closeAndGo('/login')}>
                    <LogIn size={17} /> Login
                  </button>
                )}
                <p className="mt-4 text-center text-xs font-semibold text-gray-400">Website by WayzenTech 9398724704</p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 border-t border-gray-100 bg-white pb-[max(env(safe-area-inset-bottom),0px)] shadow-nav lg:hidden">
        <MobileTab to="/services" icon={Settings} label="Services" />
        <MobileTab to="/products" icon={PackageSearch} label="Products" />
        <NavLink
          to="/"
          className="relative flex min-h-full flex-col items-center justify-center gap-0.5 overflow-visible text-[10px] font-semibold text-primary"
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-amber">
            <motion.span
              className="absolute inset-0 rounded-2xl bg-amber-400"
              initial={{ opacity: 0.9, scale: 1 }}
              animate={{ opacity: [0.9, 0.55, 0.9], scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Zap size={22} fill="currentColor" className="relative z-10" />
            {isHome && sparkParticles.map((spark, index) => (
              <motion.span
                key={index}
                className="absolute h-1.5 w-1.5 rounded-full bg-amber-300"
                animate={{ x: spark.x, y: spark.y, opacity: [1, 0], scale: [1, 0] }}
                transition={{ duration: 0.6, delay: index * 0.1, repeat: Infinity, repeatDelay: 1.8 }}
              />
            ))}
          </span>
          <span>Home</span>
        </NavLink>
        <MobileTab to={profileTo} icon={user ? UserRound : LogIn} label={user ? firstName || 'Profile' : 'Login'} />
        <button
          type="button"
          className="relative flex min-h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-400"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  )
}

function MobileTab({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex min-h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
          isActive ? 'text-primary before:absolute before:left-[20%] before:right-[20%] before:top-0 before:h-0.5 before:rounded-b before:bg-primary' : 'text-gray-400'
        }`
      }
    >
      <Icon size={21} />
      <span className="max-w-[64px] truncate">{label}</span>
    </NavLink>
  )
}

function DrawerSection({ title, links, onGo, disabled = false }) {
  return (
    <section className="border-t border-surface-border px-4 py-4">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-400">{title}</p>
      <div className="grid gap-1">
        {links.map(({ label, to, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="drawer-link disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => onGo(disabled ? '/login' : to)}
            disabled={disabled}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>
    </section>
  )
}
