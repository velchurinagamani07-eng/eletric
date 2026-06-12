import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { banners } from '../../data/catalog'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'

export default function FestivalBanner() {
  const sectionRef = useRef(null)
  const { items } = useFirestoreCollection('banners', banners, 'order')
  const activeBanners = useMemo(
    () => items.filter((banner) => banner.isActive !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
    [items],
  )
  const [index, setIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [wishedIds, setWishedIds] = useState([])
  const banner = activeBanners[index % Math.max(activeBanners.length, 1)]

  useEffect(() => {
    if (!activeBanners.length) return undefined
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % activeBanners.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [activeBanners.length])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (banner?.isFestival && isVisible && !wishedIds.includes(banner.id)) {
      confetti({
        particleCount: 55,
        spread: 62,
        origin: { y: 0.74 },
        colors: ['#F59E0B', '#FBBF24', '#3B82F6', '#10B981'],
      })
      Promise.resolve().then(() => setWishedIds((ids) => [...ids, banner.id]))
    }
  }, [banner?.id, banner?.isFestival, isVisible, wishedIds])

  if (!banner) return null

  return (
    <section ref={sectionRef} className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="relative min-h-[250px] overflow-hidden rounded-lg bg-gray-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0"
          >
            <img src={banner.imageURL} alt={banner.title} className="h-full w-full object-cover opacity-62" />
          </motion.div>
        </AnimatePresence>
        <div className="relative z-10 flex min-h-[250px] flex-col justify-end p-6 sm:p-8 lg:w-2/3">
          <span className="mb-3 inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {banner.isFestival ? 'Festival wish effect' : 'Seasonal offer'}
          </span>
          <h2 className="max-w-2xl text-2xl font-extrabold text-white sm:text-4xl">{banner.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">{banner.subtitle}</p>
          <Link to={banner.ctaLink} className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-gray-950">
            {banner.ctaText} <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  )
}
