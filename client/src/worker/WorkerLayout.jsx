import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, BellRing, ClipboardList } from 'lucide-react'

const links = [
  { label: 'Jobs', to: '/worker/dashboard', icon: ClipboardList },
  { label: 'History', to: '/worker/history', icon: BarChart3 },
  { label: 'Notifications', to: '/worker/notifications', icon: BellRing },
]

export default function WorkerLayout() {
  return (
    <main className="bg-gray-50 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Worker Panel</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-950 dark:text-white">Assigned service operations</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-gray-900">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/worker/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                      isActive
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
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

