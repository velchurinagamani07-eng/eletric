import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BriefcaseBusiness,
  CircleUserRound,
  HelpCircle,
  Home,
  Info,
  LogOut,
  Menu,
  PackageSearch,
  Phone,
  ShoppingCart,
  Settings,
  X,
  Zap,
} from 'lucide-react'
import { settings } from '../../data/catalog'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
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
  { label: 'About', to: '/about', icon: Info },
  { label: 'Contact', to: '/contact', icon: Phone },
  { label: 'FAQ', to: '/faq', icon: HelpCircle },
]

export default function MobileNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0))
  const isHome = location.pathname === '/'
  const isStaff = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'worker'

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
              <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-white/10">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
                <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 font-display text-sm font-extrabold text-[#0F172A] dark:text-white">
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

              <section className="border-b border-gray-100 px-4 py-5 bg-slate-50/70 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-400">DP Home Electric Services</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">Call +91 {settings.phone} or book any service through WhatsApp.</p>
              </section>

              <DrawerSection title="Browse" links={browseLinks} currentPath={location.pathname} onGo={closeAndGo} />

              {isStaff && (
                <section className="border-t border-gray-100 px-4 py-4 dark:border-white/10">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Staff Portal</p>
                  <div className="grid gap-1.5">
                    {user?.role === 'admin' || user?.role === 'superadmin' ? (
                      <button
                        type="button"
                        className="flex min-h-12 w-full items-center gap-3.5 rounded-2xl px-3.5 text-left text-sm font-bold text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                        onClick={() => closeAndGo('/admin/dashboard')}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <CircleUserRound size={18} />
                        </span>
                        <span className="flex-1 text-[15px] font-bold">Admin Panel</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex min-h-12 w-full items-center gap-3.5 rounded-2xl px-3.5 text-left text-sm font-bold text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                        onClick={() => closeAndGo('/worker/jobs')}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          <BriefcaseBusiness size={18} />
                        </span>
                        <span className="flex-1 text-[15px] font-bold">My Jobs</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center gap-3.5 rounded-2xl px-3.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => {
                        setDrawerOpen(false)
                        setConfirmLogout(true)
                      }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                        <LogOut size={18} />
                      </span>
                      <span className="flex-1 text-[15px] font-bold">Logout</span>
                    </button>
                  </div>
                </section>
              )}

              <div className="mt-auto border-t border-gray-100 p-4 dark:border-white/10">
                <a className="btn-primary w-full" href={`tel:+91${settings.phone}`}>
                  <Phone size={17} /> Call Now
                </a>
                <p className="mt-4 text-center text-xs font-semibold text-slate-400">Website by WayzenTech</p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Mobile Header */}
      <header className="fixed top-[var(--announcement-offset,0px)] left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-[#CBD5E1] bg-white px-4 shadow-sm transition-[top] duration-300 lg:hidden">
        <Link to="/" className="flex items-center gap-2 font-display text-sm font-extrabold text-navy">
          <span className="relative shrink-0">
            <img
              src="/logo.webp"
              alt="DP Home Electric Services"
              className="h-9 w-9 rounded-xl object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
                event.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            <span
              style={{ display: 'none' }}
              className="h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-xs font-extrabold text-white"
            >
              DP
            </span>
          </span>
          <div>
            <span className="block text-sm font-black text-[#0F172A]">{settings.shortName}</span>
            <span className="block text-[10px] font-semibold text-[#475569]">{settings.tagline}</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#0F172A]"
            aria-label="Open cart"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#0F172A]"
            aria-label="Open drawer menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 border-t border-zinc-800 bg-black pb-[max(env(safe-area-inset-bottom),0px)] shadow-nav lg:hidden">
        <MobileTab to="/services" icon={Settings} label="Services" />
        <MobileTab to="/products" icon={PackageSearch} label="Products" />
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
        description={`You're currently signed in as a ${user?.role || 'staff'}.\nYou'll need to sign in again to access your panel.`}
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

function DrawerSection({ title, links, currentPath, onGo }) {
  return (
    <section className="border-t border-gray-100 px-4 py-4 dark:border-white/10">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
      <div className="grid gap-1.5">
        {links.map(({ label, to, icon: Icon }) => {
          const isActive = to === '/' ? currentPath === '/' : currentPath.startsWith(to)
          return (
            <button
              key={label}
              type="button"
              className={`flex min-h-12 w-full items-center gap-3.5 rounded-2xl px-3.5 text-left text-sm font-bold transition-all ${
                isActive
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/50'
                  : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
              onClick={() => onGo(to)}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                }`}
              >
                <Icon size={18} strokeWidth={2.4} />
              </span>
              <span className="flex-1 text-[15px] font-bold tracking-tight">{label}</span>
              {isActive && (
                <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

