import { useState } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNotifications } from '../hooks/useNotifications'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const canViewNotifications = ['admin', 'superadmin', 'worker'].includes(user?.role)
  const { notifications, unreadCount, markRead, markAllRead, deleteRead } = useNotifications(canViewNotifications ? user : null)

  if (!canViewNotifications) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-navy-900 transition hover:border-amber-300 hover:bg-amber-50 focus-ring dark:border-white/10 dark:bg-gray-900 dark:text-gray-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-gray-950">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-navy-900 dark:text-white">Notifications</p>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={markAllRead}
              aria-label="Mark all read"
            >
              <CheckCheck size={17} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => markRead(item.id)}
                  className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-amber-50/70 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? 'bg-gray-300' : 'bg-amber-500'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy-900 dark:text-gray-100">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">{item.body}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={deleteRead}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <Trash2 size={14} /> Delete read notifications
          </button>
        </div>
      )}
    </div>
  )
}
