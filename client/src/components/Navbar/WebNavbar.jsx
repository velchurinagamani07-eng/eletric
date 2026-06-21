import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  Heart,
  LogIn,
  LogOut,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import NotificationBell from '../NotificationBell'
import ConfirmDialog from '../ConfirmDialog'
import { settings } from '../../data/catalog'
import { useProducts, productPrice } from '../../hooks/useProducts'
import { useServiceCategories, useServices } from '../../hooks/useServices'
import { useAuthStore } from '../../store/authStore'
import { useScrollPosition } from '../../hooks/useScrollPosition'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { currency } from '../../utils/format'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services', mega: true },
  { label: 'Products', to: '/products' },
  { label: 'Daily Work', to: '/daily-work' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Blog', to: '/blog' },
]

const roleMenu = {
  user: [
    ['My Dashboard', '/dashboard'],
    ['My Bookings', '/dashboard/bookings'],
    ['My Orders', '/dashboard?tab=orders'],
    ['My Wishlist', '/customer/wishlist'],
    ['My Coupons', '/dashboard/coupons'],
    ['Profile', '/dashboard/profile'],
  ],
  admin: [['Admin Panel', '/admin/dashboard']],
  superadmin: [['Admin Panel', '/admin/dashboard']],
  worker: [
    ['My Jobs', '/worker/jobs'],
    ['Job History', '/worker/history'],
    ['Profile', '/worker/profile'],
  ],
}

export default function WebNavbar() {
  const scrolled = useScrollPosition(10)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0))
  const wishlistCount = useWishlistStore((state) => state.ids.length)
  const { products } = useProducts()
  const { services } = useServices({ onlyActive: true })
  const { categories } = useServiceCategories({ includeAll: false })
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const searchResults = useMemo(() => {
    const needle = searchText.trim().toLowerCase()
    if (!needle) return []
    const serviceMatches = services
      .filter((service) => [service.name, service.shortDescription].some((value) => String(value).toLowerCase().includes(needle)))
      .slice(0, 5)
      .map((service) => ({ label: service.name, caption: 'Service', to: `/services/${service.slug || service.id}` }))
    const productMatches = products
      .filter((product) => [product.name, product.brand, product.shortDescription].some((value) => String(value || '').toLowerCase().includes(needle)))
      .slice(0, 5)
      .map((product) => ({ label: product.name, caption: `Product | ${currency(productPrice(product))}`, to: `/products/${product.slug}` }))
    return [...serviceMatches, ...productMatches]
  }, [products, searchText, services])

  const menuLinks = roleMenu[user?.role] || roleMenu.user

  return (
    <>
      <header
        className={`navbar-fixed hidden border-b bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/95 lg:block ${
          scrolled ? 'is-scrolled border-[#E2E8F0]' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
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
            <span>
              <span className="block text-lg font-black tracking-normal text-[#0F172A] dark:text-white">
                {settings.shortName}
              </span>
              <span className="block text-xs font-semibold text-[#475569]">{settings.tagline}</span>
            </span>
          </Link>

          <nav className="flex items-center gap-7">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.mega && setMegaOpen(true)}
                onMouseLeave={() => item.mega && setMegaOpen(false)}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `animated-underline inline-flex items-center gap-1 text-sm font-semibold transition ${
                      isActive ? 'active text-[#0F172A] dark:text-white' : 'text-[#475569] hover:text-[#0F172A] dark:text-gray-300'
                    }`
                  }
                >
                  {item.label} {item.mega && <ChevronDown size={14} />}
                </NavLink>

                {item.mega && megaOpen && (
                  <div className="absolute left-1/2 top-full z-50 mt-5 w-[760px] -translate-x-1/2 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-gray-950">
                    <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">All Services</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {categories.map((category) => (
                            <Link
                              key={category.id}
                              to={`/services?category=${category.id}`}
                              className="rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] px-3 py-3 text-sm font-bold text-[#0F172A] hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Recommended Products</p>
                        <div className="mt-3 grid gap-2">
                          {products.slice(0, 3).map((product) => (
                            <Link
                              key={product.id}
                              to={`/products/${product.slug}`}
                              className="rounded-xl border border-[#E2E8F0] px-3 py-3 hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:hover:bg-white/5"
                            >
                              <span className="block text-sm font-bold text-[#0F172A] dark:text-white">{product.name}</span>
                              <span className="mt-1 block text-xs font-semibold text-[#475569]">{currency(productPrice(product))}</span>
                            </Link>
                          ))}
                          <Link to="/products" className="btn-secondary mt-1 w-full">All Products</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-amber-300 hover:bg-amber-50 focus-ring dark:border-white/10 dark:bg-gray-900 dark:text-gray-100"
              aria-label="Open search"
            >
              <Search size={18} />
            </button>
            <NotificationBell />
            <Link
              to="/customer/wishlist"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-white hover:border-red-600 hover:bg-red-600/10 focus-ring"
              aria-label="Open wishlist"
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-white hover:border-red-600 hover:bg-red-600/10 focus-ring"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setDark((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-amber-300 hover:bg-amber-50 focus-ring dark:border-white/10 dark:bg-gray-900 dark:text-gray-100"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex h-11 items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-2 pr-3 text-sm font-semibold text-[#0F172A] hover:border-amber-300 focus-ring dark:border-white/10 dark:bg-gray-900 dark:text-gray-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-100">
                    {user.photoURL ? <img src={user.photoURL} alt="" className="h-8 w-8 object-cover" /> : <UserRound size={17} />}
                  </span>
                  <span className="max-w-28 truncate">{user.name || 'Account'}</span>
                  <ChevronDown size={15} />
                </button>
              ) : (
                <Link to="/login" className="btn-primary px-5">
                  <LogIn size={17} /> Login
                </Link>
              )}

              {menuOpen && user && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl dark:border-white/10 dark:bg-gray-950">
                  {menuLinks.map(([label, to]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => {
                        setMenuOpen(false)
                        navigate(to)
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 dark:text-gray-100 dark:hover:bg-white/5"
                    >
                      {label}
                    </button>
                  ))}
                  {(user.role === 'admin' || user.role === 'superadmin' || user.role === 'worker') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate(user.role === 'worker' ? '/worker/notifications' : '/admin/notifications')
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 dark:text-gray-100 dark:hover:bg-white/5"
                    >
                      <Bell size={16} /> Notifications
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setConfirmLogout(true)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-white/95 p-6 backdrop-blur-xl dark:bg-gray-950/95">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  autoFocus
                  className="h-14 w-full rounded-2xl border border-[#E2E8F0] bg-white pl-12 pr-4 text-lg font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search services or products"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-gray-900">
              {searchResults.length === 0 ? (
                <p className="px-5 py-8 text-sm font-semibold text-[#475569]">Start typing to search services and products.</p>
              ) : (
                searchResults.map((item) => (
                  <button
                    type="button"
                    key={`${item.caption}-${item.label}`}
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchText('')
                      navigate(item.to)
                    }}
                    className="block w-full border-b border-[#E2E8F0] px-5 py-4 text-left last:border-b-0 hover:bg-amber-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <span className="block font-bold text-[#0F172A] dark:text-white">{item.label}</span>
                    <span className="mt-1 block text-xs font-semibold text-[#475569] dark:text-gray-400">{item.caption}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
