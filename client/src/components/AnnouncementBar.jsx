import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { defaultAnnouncements } from '../data/announcements'

export default function AnnouncementBar({ visible, onClose }) {
  const { items } = useFirestoreCollection('announcement_messages', defaultAnnouncements, 'order')
  const messages = [...(items.length ? items : defaultAnnouncements)]
    .filter((item) => item.isActive !== false && item.text)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
  const [index, setIndex] = useState(0)
  const [showing, setShowing] = useState(true)

  useEffect(() => {
    if (!visible || !messages.length) return undefined
    const interval = window.setInterval(() => {
      setShowing(false)
      window.setTimeout(() => {
        setIndex((value) => (value + 1) % messages.length)
        setShowing(true)
      }, 400)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [messages.length, visible])

  if (!visible || !messages.length) return null

  const active = messages[index % messages.length]
  const content = (
    <span className={`transition-opacity duration-[400ms] ${showing ? 'opacity-100' : 'opacity-0'}`}>
      {active.text}
    </span>
  )

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center bg-gradient-to-r from-[#FF6B35] to-[#F59E0B] px-10 text-center text-xs font-black text-white shadow-sm lg:h-10 lg:text-sm">
      {active.href ? (
        <a href={active.href} className="truncate">
          {content}
        </a>
      ) : (
        <p className="truncate">{content}</p>
      )}
      <button
        type="button"
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/15"
        onClick={onClose}
      >
        <X size={16} />
      </button>
    </div>
  )
}
