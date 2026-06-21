import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgePercent,
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  Heart,
  HelpCircle,
  Home,
  Info,
  LogIn,
  LogOut,
  Menu,
  PackageSearch,
  Phone,
  ShoppingCart,
  Settings,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { settings } from '../../data/catalog'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import ConfirmDialog from '../ConfirmDialog'

const sparkParticles = [
  { x: -16, y: -12 },
  { x: 18, y: -10 },
  { x: 0, y: -22 },
]

const browseLinks = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Services', to: '/services', icon: Settings },
  { label: 'Products', to: '/products', icon: PackageSearch },
  { label: 'Daily Work', to: '/daily-work', icon: CalendarDays },
  { label: 'About', to: '/about', icon: Info },
  { label: 'Contact', to: '/contact', icon: Phone },
  { label: 'FAQ', to: '/faq', icon: HelpCircle },
]

const accountLinks = [
  { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarDays },
  { label: 'My Orders', to: '/dashboard', icon: PackageSearch },
  { label: 'My Wishlist', to: '/customer/wishlist', icon: Heart },
  { label: 'My Coupons', to: '/dashboard/coupons', icon: BadgePercent },
  { label: 'Profile Settings', to: '/dashboard/profile', icon: UserRound },
]

export default function MobileNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0))
  const wishlistCount = useWishlistStore((state) => state.ids.length)
  const isHome = location.pathname === '/'

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
                  <span className="relative shrink-0">
                    <img
                      src="/logo.webp"
                      alt="DP Home Electric Services"
                      className="h-10 w-10 rounded-xl object-contain"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                        event.currentTarget.nextSibling.style.display = 'flex'
                      }}
                    />
                    <span
                      style={{ display: 'none' }}
                      className="h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-sm font-extrabold text-white"
                    >
                      DP
                    </span>
                  </span>
                  {settings.shortName}
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
                    onClick={() => {
                      setDrawerOpen(false)
                      setConfirmLogout(true)
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 border-t border-zinc-800 bg-black pb-[max(env(safe-area-inset-bottom),0px)] shadow-nav lg:hidden">
        <MobileTab to="/services" icon={Settings} label="Services" />
        <MobileTab to="/customer/wishlist" icon={Heart} label="Wishlist" badge={wishlistCount} />
        <NavLink
          to="/"
          className="relative flex min-h-full flex-col items-center justify-center gap-0.5 overflow-visible text-[10px] font-semibold text-red-500"
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-red-600 text-white shadow-red">
            <motion.span
              className="absolute inset-0 rounded-2xl bg-red-500"
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
        <MobileTab to="/cart" icon={ShoppingCart} label="Cart" badge={cartCount} />
        <button
          type="button"
          className="relative flex min-h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-400"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </nav>
      <ConfirmDialog
        open={confirmLogout}
        title={`Log out of ${user?.name || 'your'} account?`}
        description={`You're currently signed in as a ${user?.role || 'user'}.\nYou'll need to sign in again to access your dashboard.`}
        confirmLabel="Log Out"
        confirmVariant="danger"
        onClose={() => setConfirmLogout(false)}
        onConfirm={async () => {
          await logout()
          setConfirmLogout(false)
          navigate('/')
        }}
      />
    </>
  )
}

function MobileTab({ to, icon: Icon, label, badge = 0 }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex min-h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
          isActive ? 'text-red-500 before:absolute before:left-[20%] before:right-[20%] before:top-0 before:h-0.5 before:rounded-b before:bg-red-600' : 'text-gray-400'
        }`
      }
    >
      <span className="relative">
        <Icon size={21} />
        {badge > 0 && (
          <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
            {badge}
          </span>
        )}
      </span>
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
