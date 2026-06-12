import { BellRing, Volume2 } from 'lucide-react'
import { notifications } from '../data/catalog'

export default function WorkerNotifications({ workerId = 'worker-1' }) {
  const workerNotifications = notifications.filter((item) => item.userId === workerId || item.role === 'worker')

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-white/10">
        <h2 className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
          <BellRing size={18} /> Worker Notifications
        </h2>
        <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Volume2 size={14} /> A notification chime can play when browser permissions allow audio.
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {workerNotifications.map((item) => (
          <article key={item.id} className="p-4">
            <p className="font-bold text-gray-950 dark:text-white">{item.title}</p>
            <p className="mt-1 text-sm text-gray-500">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

