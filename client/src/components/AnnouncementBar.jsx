import { useMemo } from 'react'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { defaultAnnouncements } from '../data/announcements'

const blockedPattern = /tdp|mla|narasaraopet|chadalavada|aravinda|telugu|daily\s*work|tv\s*display|నరసరావుపేట|చదలవాడ|అరవింద|నేటి/i

const normalizePhone = (phone = '') => String(phone).replace(/[^\d+]/g, '')

function getMessageHref(message) {
  if (message.href) return message.href
  const phone = normalizePhone(message.phone)
  if (!phone) return ''
  return `tel:${phone.startsWith('+') ? phone : `+91${phone}`}`
}

export default function AnnouncementBar({ visible }) {
  const { items } = useFirestoreCollection('announcement_messages', defaultAnnouncements, 'order')

  const messages = useMemo(() => {
    const source = items.length ? items : defaultAnnouncements
    const filtered = source
      .filter((item) => item.isActive !== false && item.text && !blockedPattern.test(item.text))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    return filtered.length ? filtered : defaultAnnouncements
  }, [items])

  if (!visible || !messages.length) return null

  const track = [...messages, ...messages]

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-9 overflow-hidden border-b border-red-900/30 bg-[#0A0A0A] text-xs font-semibold text-white shadow-[0_1px_18px_rgba(220,38,38,0.18)] sm:h-10 sm:text-[13px]">
      <div className="announcement-marquee flex h-full w-max items-center gap-10 whitespace-nowrap px-6">
        {track.map((message, index) => {
          const href = getMessageHref(message)
          const className = "inline-flex h-full items-center text-white hover:text-red-100"
          return href ? (
            <a key={`${message.id || message.text}-${index}`} href={href} className={className}>
              {message.text}
            </a>
          ) : (
            <span key={`${message.id || message.text}-${index}`} className={className}>
              {message.text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
