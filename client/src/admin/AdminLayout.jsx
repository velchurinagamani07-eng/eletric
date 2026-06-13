import { NavLink, Outlet } from 'react-router-dom'
import {
  BellRing,
  ChartNoAxesCombined,
  ClipboardList,
  Gauge,
  Gift,
  Image,
  PackageSearch,
  CreditCard,
  Settings,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'

const links = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Payment Verifications', to: '/admin/payments', icon: CreditCard },
  { label: 'Customers', to: '/admin/customers', icon: UserRound },
  { label: 'Workers', to: '/admin/workers', icon: Users },
  { label: 'Services', to: '/admin/services', icon: Wrench },
  { label: 'Products', to: '/admin/products', icon: PackageSearch },
  { label: 'Coupons', to: '/admin/coupons', icon: Gift },
  { label: 'Banners', to: '/admin/banners', icon: Image },
  { label: 'Splash', to: '/admin/splash', icon: Sparkles },
  { label: 'Income', to: '/admin/income', icon: ChartNoAxesCombined },
  { label: 'Notifications', to: '/admin/notifications', icon: BellRing },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
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
    </main>
  )
}
