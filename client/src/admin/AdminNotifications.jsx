import { useMemo, useState } from 'react'
import { BellRing, CheckCheck, Trash2, Volume2 } from 'lucide-react'
import { notifications } from '../data/catalog'

export default function AdminNotifications() {
  const [readIds, setReadIds] = useState([])
  const adminNotifications = useMemo(
    () => notifications.filter((item) => item.role === 'admin' || item.userId === 'admin'),
    [],
  )

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white"><BellRing size={18} /> Admin Notifications</h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-gray-500"><Volume2 size={14} /> New booking, payment, work completed and photo upload events.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => setReadIds(adminNotifications.map((item) => item.id))}><CheckCheck size={17} /> Mark all read</button>
          <button type="button" className="btn-secondary"><Trash2 size={17} /> Delete old</button>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {adminNotifications.map((item) => (
          <article key={item.id} className="flex gap-3 p-4">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${readIds.includes(item.id) || item.isRead ? 'bg-gray-300' : 'bg-red-500'}`} />
            <div>
              <p className="font-bold text-gray-950 dark:text-white">{item.title}</p>
              <p className="mt-1 text-sm text-gray-500">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

