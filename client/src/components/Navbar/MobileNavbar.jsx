import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bolt, Home, Menu, PackageSearch, ShoppingCart, UserRound, Wrench, X } from 'lucide-react'
import { settings } from '../../data/catalog'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const tabs = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Services', to: '/services', icon: Wrench },
  { label: 'Products', to: '/products', icon: PackageSearch },
  { label: 'Cart', to: '/cart', icon: ShoppingCart, badge: true },
  { label: 'Profile', to: '/dashboard/profile', icon: UserRound },
]

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function MobileNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0))
  const navigate = useNavigate()

  const roleLinks = [
    user?.role === 'user' && { label: 'My Bookings', to: '/dashboard/bookings' },
    user?.role === 'user' && { label: 'Profile', to: '/dashboard/profile' },
    user?.role === 'admin' && { label: 'Admin Panel', to: '/admin' },
    user?.role === 'worker' && { label: 'My Jobs', to: '/worker/jobs' },
    user?.role === 'worker' && { label: 'Earnings', to: '/worker/earnings' },
  ].filter(Boolean)

  return (
    <>
      <div className="navbar-fixed flex items-center justify-between border-b border-navy-900/10 bg-white px-4 dark:border-white/10 dark:bg-gray-950 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full text-navy-900 hover:bg-gray-100 focus-ring dark:text-white dark:hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu size={23} />
        </button>
        <Link to="/" className="flex min-h-12 items-center gap-2 text-sm font-extrabold text-navy-900 dark:text-white">
          <Bolt className="text-amber-500" fill="currentColor" size={20} />
          {settings.shortName}
        </Link>
        <Link
          to="/cart"
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-full text-navy-900 hover:bg-gray-100 focus-ring dark:text-white dark:hover:bg-white/10"
          aria-label="Open cart"
        >
          <ShoppingCart size={21} />
          {cartCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-gray-950/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              className="flex h-full w-[86vw] max-w-sm flex-col bg-white p-5 shadow-2xl dark:bg-gray-950"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-navy-900">
                    {user?.photoURL ? <img src={user.photoURL} alt="" className="h-12 w-12 rounded-full object-cover" /> : <UserRound size={22} />}
                  </span>
                  <div>
                    <p className="font-bold text-navy-900 dark:text-white">{user?.name || 'Guest User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'Login to manage bookings'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-8 grid gap-2">
                {[...publicLinks, ...roleLinks].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-12 items-center rounded-lg px-4 text-sm font-semibold text-gray-700 hover:bg-amber-50 dark:text-gray-100 dark:hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-gray-100 pt-4 dark:border-white/10">
                {user ? (
                  <button
                    type="button"
                    className="min-h-12 w-full rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      await logout()
                      setDrawerOpen(false)
                      navigate('/login')
                    }}
                  >
                    Logout
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setDrawerOpen(false)} className="btn-primary w-full">
                    Login
                  </Link>
                )}
                <p className="mt-4 text-center text-xs font-semibold text-gray-400">WayzenTech 9398724704</p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-950 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="activeTab"
                        className="absolute inset-1 rounded-lg bg-amber-500"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative">
                      <Icon size={20} />
                      {item.badge && cartCount > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
                          {cartCount}
                        </span>
                      )}
                    </span>
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </>
  )
}
