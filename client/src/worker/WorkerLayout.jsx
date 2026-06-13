import { NavLink, Outlet } from 'react-router-dom'
import { BellRing, ClipboardList, History, UserRound } from 'lucide-react'

const links = [
  { label: 'My Jobs', to: '/worker/dashboard', icon: ClipboardList },
  { label: 'Job History', to: '/worker/history', icon: History },
  { label: 'Notifications', to: '/worker/notifications', icon: BellRing },
  { label: 'Profile', to: '/worker/profile', icon: UserRound },
]

export default function WorkerLayout() {
  return (
    <main className="min-h-screen bg-surface py-6 dark:bg-gray-950 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7">
          <p className="eyebrow">Worker Panel</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy dark:text-white">Assigned service operations</h1>
        </div>
        <div className="grid gap-5">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-surface-border bg-white p-2 shadow-card dark:border-white/10 dark:bg-gray-900">
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
          </nav>
          <Outlet />
        </div>
      </div>
    </main>
  )
}
