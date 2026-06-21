import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { defaultAnnouncements } from '../data/announcements'

const normalizePhone = (phone = '') => String(phone).replace(/[^\d+]/g, '')

function getMessageHref(message) {
  if (message.href) return message.href
  const phone = normalizePhone(message.phone)
  if (!phone) return ''
  return `tel:${phone.startsWith('+') ? phone : `+91${phone}`}`
}

export default function AnnouncementBar({ visible }) {
  const { items } = useFirestoreCollection('announcement_messages', defaultAnnouncements, 'order')
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [speedSeconds, setSpeedSeconds] = useState(4)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    return onSnapshot(
      doc(db, 'settings', 'announcementBar'),
      (snapshot) => {
        const data = snapshot.data()
        const speed = Number(data?.rotationSpeedSeconds || data?.rotationSpeed || 4)
        if (Number.isFinite(speed) && speed >= 2) setSpeedSeconds(speed)
      },
      () => {},
    )
  }, [])

  const messages = useMemo(
    () =>
      [...(items.length ? items : defaultAnnouncements)]
        .filter((item) => item.isActive !== false && item.text)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
    [items],
  )

  useEffect(() => {
    if (!messages.length) return undefined
    setActiveIndex((index) => index % messages.length)
    if (paused || messages.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % messages.length)
    }, speedSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [messages.length, paused, speedSeconds])

  if (!visible || !messages.length) return null

  const active = messages[activeIndex % messages.length]
  const href = getMessageHref(active)
  const content = (
    <span className="inline-flex min-w-0 items-center justify-center gap-2 px-3">
      {active.icon && <span className="text-red-500" aria-hidden="true">{active.icon}</span>}
      <span className="truncate text-center">
        {active.text}
      </span>
      {active.phone && <span className="hidden font-black text-red-400 sm:inline">Tap to call</span>}
    </span>
  )

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-9 overflow-hidden border-b border-red-900/30 bg-[#0A0A0A] text-xs font-semibold text-white shadow-[0_1px_18px_rgba(220,38,38,0.18)] sm:h-10 sm:text-[13px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center px-4">
        {href ? (
          <a
            href={href}
            className="flex h-full max-w-full items-center justify-center transition-all duration-300 hover:text-red-100"
            aria-label={active.phone ? `Call ${active.phone}` : active.text}
          >
            <span key={active.id || active.text} className="animate-[announcementFade_360ms_ease_both]">
              {content}
            </span>
          </a>
        ) : (
          <span key={active.id || active.text} className="flex h-full max-w-full animate-[announcementFade_360ms_ease_both] items-center justify-center">
            {content}
          </span>
        )}

        {messages.length > 1 && (
          <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1.5 sm:flex">
            {messages.map((message, index) => (
              <button
                key={message.id || `${message.text}-${index}`}
                type="button"
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-4 bg-red-500' : 'w-1.5 bg-white/30'}`}
                aria-label={`Show announcement ${index + 1}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
