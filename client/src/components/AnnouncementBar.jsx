import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [index, setIndex] = useState(0)

  const messages = useMemo(() => {
    const source = items.length ? items : defaultAnnouncements
    const filtered = source
      .filter((item) => item.isActive !== false && item.text && !blockedPattern.test(item.text))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    return filtered.length ? filtered : defaultAnnouncements
  }, [items])

  useEffect(() => {
    if (!messages.length) return
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [messages.length])

  useEffect(() => {
    setIndex(0)
  }, [messages])

  if (!visible || !messages.length) return null

  const currentMessage = messages[index] || messages[0]
  if (!currentMessage) return null

  const href = getMessageHref(currentMessage)
  const isClickable = !!href

  const displayIcon = currentMessage.icon || ''
  const displayText = currentMessage.text || ''
  const showIcon = displayIcon && !displayText.trim().startsWith(displayIcon)

  const content = (
    <div className="flex h-full items-center justify-center gap-2 px-4 text-center">
      {showIcon && <span>{displayIcon}</span>}
      <span>{displayText}</span>
    </div>
  )

  const wrapperClass = "fixed inset-x-0 top-0 z-[60] h-9 border-b border-red-900/30 bg-[#0A0A0A] text-xs font-semibold text-white shadow-[0_1px_18px_rgba(220,38,38,0.18)] sm:h-10 sm:text-[13px] flex items-center justify-center overflow-hidden"

  return (
    <div className={wrapperClass}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="w-full h-full flex items-center justify-center"
        >
          {isClickable ? (
            <a
              href={href}
              className="inline-flex h-full w-full items-center justify-center text-white hover:text-red-100 transition duration-150"
            >
              {content}
            </a>
          ) : (
            <div className="inline-flex h-full w-full items-center justify-center text-white">
              {content}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
