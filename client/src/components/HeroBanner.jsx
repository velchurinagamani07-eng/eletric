import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, PhoneCall, ShieldCheck, Sparkles, Star, Users, Wrench, Zap } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { defaultHero, settings } from '../data/catalog'

const trustIcons = [ShieldCheck, Users, Wrench, BadgeCheck]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

function HeroImageStack({ images, customerCount }) {
  const visibleImages = (images || []).filter(Boolean).slice(0, 4)

  if (visibleImages.length === 0) {
    return (
      <div className="relative min-h-[430px]">
        <div className="absolute left-5 top-6 h-72 w-52 rounded-2xl border border-[#E2E8F0] bg-[#F8F9FA] shadow-[0_8px_32px_rgba(0,0,0,0.08)]" />
        <div className="absolute right-2 top-20 h-56 w-52 rounded-2xl border border-amber-200 bg-amber-50 shadow-[0_8px_32px_rgba(245,158,11,0.18)]" />
        <div className="absolute bottom-10 left-28 h-36 w-44 rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]" />
        <div className="absolute inset-0 grid place-items-center text-[#0F172A]">
          <Zap className="h-28 w-28 text-amber-500" fill="currentColor" />
        </div>
        <CustomerBadge customerCount={customerCount} />
      </div>
    )
  }

  return (
    <div className="relative min-h-[430px]">
      {visibleImages[0] && (
        <motion.img
          src={visibleImages[0]}
          alt=""
          className="absolute left-1 top-5 h-72 w-[52%] rounded-2xl border border-white object-cover shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition duration-300 hover:scale-[1.02] sm:left-8"
          loading="eager"
          width="420"
          height="560"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        />
      )}
      {visibleImages[1] && (
        <motion.img
          src={visibleImages[1]}
          alt=""
          className="absolute right-0 top-20 h-56 w-[48%] rounded-2xl border border-white object-cover shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition duration-300 hover:scale-[1.02]"
          loading="eager"
          width="420"
          height="420"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        />
      )}
      {visibleImages[2] && (
        <motion.img
          src={visibleImages[2]}
          alt=""
          className="absolute bottom-8 left-[26%] h-40 w-[42%] rounded-2xl border border-white object-cover shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition duration-300 hover:scale-[1.02]"
          loading="lazy"
          width="360"
          height="260"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.38 }}
        />
      )}
      {visibleImages[3] && (
        <motion.img
          src={visibleImages[3]}
          alt=""
          className="absolute bottom-24 right-8 hidden h-28 w-28 rounded-2xl border border-white object-cover shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition duration-300 hover:scale-[1.02] sm:block"
          loading="lazy"
          width="220"
          height="220"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.48 }}
        />
      )}
      <CustomerBadge customerCount={customerCount} />
    </div>
  )
}

function CustomerBadge({ customerCount }) {
  return (
    <motion.div
      className="absolute bottom-4 right-4 flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <Star size={20} fill="currentColor" />
      </span>
      <span>
        <span className="block font-mono text-lg font-black text-[#0F172A]">{Number(customerCount || 500).toLocaleString('en-IN')}+</span>
        <span className="block text-xs font-bold text-[#475569]">Happy Customers</span>
      </span>
    </motion.div>
  )
}

export default function HeroBanner() {
  const [hero, setHero] = useState(defaultHero)
  const [loading, setLoading] = useState(Boolean(isFirebaseConfigured && db))

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setHero(defaultHero)
        setLoading(false)
      })
      return undefined
    }

    const fallbackTimer = window.setTimeout(() => {
      setHero(defaultHero)
      setLoading(false)
    }, 3500)

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'hero'),
      (snapshot) => {
        window.clearTimeout(fallbackTimer)
        setHero({ ...defaultHero, ...(snapshot.exists() ? snapshot.data() : {}) })
        setLoading(false)
      },
      () => {
        window.clearTimeout(fallbackTimer)
        setHero(defaultHero)
        setLoading(false)
      },
    )
    return () => {
      window.clearTimeout(fallbackTimer)
      unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <section className="bg-[#FAFAFA] px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="h-8 w-56 animate-pulse rounded-full bg-slate-200" />
            <div className="h-20 w-full animate-pulse rounded-xl bg-slate-200" />
            <div className="h-24 w-5/6 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="min-h-[430px] animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    )
  }

  if (hero?.isActive === false) return null

  const badgeLabels = [hero.badge1, hero.badge2, hero.badge3, hero.badge4, hero.badgeText1, hero.badgeText2, hero.badgeText3, hero.badgeText4]
    .filter(Boolean)
    .slice(0, 4)

  return (
    <section className="overflow-hidden bg-[#FAFAFA]">
      <div className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1 }}>
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
          >
            <Sparkles size={16} /> {hero.badgeText || 'Tuni trusted electrical service'}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl lg:text-6xl"
          >
            {hero.headline}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-base leading-8 text-[#475569] sm:text-lg">
            {hero.subheadline}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={hero.ctaLink || '/booking'} className="btn-primary px-6 py-3">
              {hero.ctaText || 'Book a Service'} <ArrowRight size={18} />
            </Link>
            <a href={`tel:+91${settings.phone}`} className="btn-secondary px-6 py-3">
              <PhoneCall size={18} /> Call Us
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {badgeLabels.map((label, index) => {
              const Icon = trustIcons[index] || BadgeCheck
              return (
                <span
                  key={`${label}-${index}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0F172A] shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                >
                  <Icon className="text-amber-600" size={17} /> {label}
                </span>
              )
            })}
          </motion.div>
        </motion.div>

        <HeroImageStack images={hero.images} customerCount={hero.customerCount || hero.customers} />
      </div>
    </section>
  )
}
