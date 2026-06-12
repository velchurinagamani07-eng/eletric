import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

const sessionKey = 'hes-splash-seen'

const asDate = (value, fallback) => value?.toDate?.() || (value ? new Date(value) : fallback)

export default function EntrySplash() {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [ready, setReady] = useState(false)
  const [splash, setSplash] = useState(null)

  useEffect(() => {
    if (sessionStorage.getItem(sessionKey)) return undefined

    let alive = true
    const readyTimer = window.setTimeout(() => {
      if (alive) setReady(true)
    }, 1500)

    async function fetchSplash() {
      if (!db || !isFirebaseConfigured) return

      const snap = await getDoc(doc(db, 'settings', 'splash'))
      if (!alive || !snap.exists()) return

      const data = snap.data()
      const now = new Date()
      const start = asDate(data.startDate, new Date(0))
      const end = asDate(data.endDate, new Date('2099-01-01T00:00:00'))

      if (data.isActive && data.imageURL && now >= start && now <= end) {
        setSplash(data)
        setShow(true)
      }
    }

    fetchSplash().catch(() => {})

    return () => {
      alive = false
      window.clearTimeout(readyTimer)
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(sessionKey, '1')
    setShow(false)

    const link = splash?.ctaLink?.trim()
    if (!link) return
    if (/^https?:\/\//i.test(link)) window.location.href = link
    else navigate(link)
  }

  return (
    <AnimatePresence>
      {show && splash && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-end overflow-hidden pb-10 text-white sm:pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55 }}
        >
          <img
            src={splash.imageURL}
            alt="Welcome"
            className="absolute inset-0 h-full w-full object-cover"
            width="1920"
            height="1080"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

          <motion.div
            className="relative z-10 flex w-full max-w-lg flex-col items-center gap-4 px-5 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: ready ? 0 : 20, opacity: ready ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-7 py-3 text-sm font-black text-[#0F172A] shadow-[0_8px_32px_rgba(245,158,11,0.45)] transition hover:bg-[#D97706] active:scale-95 sm:text-base"
            >
              {splash.ctaLabel || 'Continue to Website'} <ArrowRight size={18} />
            </button>
            <p className="text-[11px] font-medium tracking-wide text-white/65">
              Website made by WayzenTech - 9398724704
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
