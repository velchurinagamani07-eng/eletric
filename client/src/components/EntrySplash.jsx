import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

const sessionKey = 'hes-splash-seen'

const asDate = (value, fallback) => value?.toDate?.() || (value ? new Date(value) : fallback)

export default function EntrySplash() {
  const navigate = useNavigate()
  const [splash, setSplash] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(sessionKey)) return undefined
    let alive = true

    async function fetchSplash() {
      if (!db || !isFirebaseConfigured) return
      const snap = await getDoc(doc(db, 'settings', 'splash'))
      if (!alive || !snap.exists()) return

      const data = snap.data()
      const now = new Date()
      const start = asDate(data.startDate, new Date(0))
      const end = asDate(data.endDate, new Date('2099-01-01T00:00:00'))

      if (data.isActive && data.imageURL && now >= start && now <= end) {
        window.setTimeout(() => {
          if (!alive) return
          setSplash(data)
          setShow(true)
        }, 700)
      }
    }

    fetchSplash().catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const close = () => {
    sessionStorage.setItem(sessionKey, '1')
    setShow(false)
  }

  const continueToCta = () => {
    const link = splash?.ctaLink?.trim()
    close()
    if (!link) return
    if (/^https?:\/\//i.test(link)) window.location.href = link
    else navigate(link)
  }

  return (
    <AnimatePresence>
      {show && splash && (
        <motion.div
          className="fixed inset-0 z-[9999] grid place-items-center bg-gray-950/65 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.article
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-navy shadow hover:bg-white"
              onClick={close}
              aria-label="Close welcome popup"
            >
              <X size={18} />
            </button>
            <img
              src={splash.imageURL}
              alt={splash.headline || 'Welcome offer'}
              width="448"
              height="260"
              loading="eager"
              decoding="async"
              className="h-[260px] w-full object-cover"
            />
            <div className="p-6 text-center">
              {splash.badgeText && (
                <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                  {splash.badgeText}
                </span>
              )}
              <h2 className="mt-3 font-display text-2xl font-extrabold text-navy">
                {splash.headline || 'Welcome to DP Home Electric Services'}
              </h2>
              {splash.subtext && <p className="mt-2 text-sm leading-6 text-gray-500">{splash.subtext}</p>}
              <button type="button" className="btn-primary mt-5 w-full" onClick={continueToCta}>
                {splash.ctaLabel || splash.ctaText || 'Continue to Website'} <ArrowRight size={17} />
              </button>
              <p className="mt-4 text-[11px] font-semibold text-gray-400">Website made by WayzenTech Contact 9398724704</p>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
