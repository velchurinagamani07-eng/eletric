import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { doc, onSnapshot } from 'firebase/firestore'
import { BadgeCheck, ShieldCheck, Star, Users, Zap } from 'lucide-react'
import { defaultHero, settings } from '../data/catalog'
import { db, isFirebaseConfigured } from '../firebase/config'

const SLIDE_INTERVAL = 2000

export default function HeroSlider() {
  const [hero, setHero] = useState(defaultHero)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    const timer = window.setTimeout(() => setHero(defaultHero), 3000)
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'hero'),
      (snapshot) => {
        window.clearTimeout(timer)
        setHero(snapshot.exists() ? { ...defaultHero, ...snapshot.data() } : defaultHero)
      },
      () => {
        window.clearTimeout(timer)
        setHero(defaultHero)
      },
    )
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  const slides = useMemo(() => {
    const liveSlides = Array.isArray(hero?.slides) ? hero.slides.filter((slide) => slide.imageURL) : []
    if (liveSlides.length) return liveSlides.slice(0, 8)
    const imageSlides = Array.isArray(hero?.images) ? hero.images.filter(Boolean).map((imageURL, index) => ({ id: `image-${index}`, imageURL })) : []
    return imageSlides.length ? imageSlides.slice(0, 8) : [{ id: 'fallback', imageURL: '' }]
  }, [hero])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const interval = window.setInterval(() => {
      setCurrentSlide((value) => (value + 1) % slides.length)
    }, SLIDE_INTERVAL)
    return () => window.clearInterval(interval)
  }, [slides.length])

  const activeIndex = currentSlide % slides.length

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-navy-900">
      <AnimatePresence initial={false}>
        <motion.div
          key={slides[activeIndex]?.id || activeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {slides[activeIndex]?.imageURL ? (
            <img
              src={slides[activeIndex].imageURL}
              alt={slides[activeIndex].altText || settings.companyName}
              className="h-full w-full object-cover"
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-navy-900 via-navy-700 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto grid min-h-[88vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/10 px-4 py-2 text-sm font-bold text-amber-300 backdrop-blur">
            <Zap size={15} fill="currentColor" /> {hero?.badgeText || settings.tagline}
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {hero?.headline || defaultHero.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
            {hero?.subheadline || defaultHero.subheadline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={hero?.ctaLink || '/booking'} className="btn-primary px-7 py-4">
              {hero?.ctaText || 'Book a Service'}
            </Link>
            <a href={`tel:+91${settings.phone}`} className="btn-secondary px-7 py-4">
              Call +91 {settings.phone}
            </a>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [hero?.badgeText1 || '1 Month Warranty', ShieldCheck],
              [hero?.badgeText2 || 'Verified Workers', BadgeCheck],
              [hero?.badgeText3 || 'Same-day Service', Zap],
              [hero?.badgeText4 || '5-Star Rated', Star],
            ].map(([label, Icon]) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-3 text-sm font-bold text-white backdrop-blur">
                <Icon className="mb-2 text-amber-300" size={18} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="ml-auto max-w-sm rounded-lg border border-white/15 bg-white/10 p-5 text-white backdrop-blur">
            <Users className="text-amber-300" size={24} />
            <p className="mt-4 text-4xl font-black">{hero?.customers || 500}+</p>
            <p className="mt-1 text-sm font-semibold text-white/75">Happy customers served in {settings.areaServed}</p>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id || index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/50'}`}
              aria-label={`Show hero slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
