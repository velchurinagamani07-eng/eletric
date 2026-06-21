import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  GraduationCap,
  IndianRupee,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'

const COMPANY = {
  name: 'DP Home Electric Services',
  founder: 'MANEPALLI DILIP KUMAR',
  location: 'Tuni, Andhra Pradesh',
  fullLocation: 'Tuni, Andhra Pradesh, India',
  phone: '+91 9493745479',
  whatsapp: '919493745479',
  founded: '2020',
  builtBy: 'WayzenTech - 9398724704',
}

const FOUNDER = {
  initials: 'MDK',
  name: 'MANEPALLI DILIP KUMAR',
  role: 'Founder & CEO',
  degree: 'B.E. Electrical Engineering',
  college: 'Manchian Engineering College',
  quote: 'Every home in Tuni deserves safe, reliable electrical work, not just the ones who can afford to overpay.',
}

const timeline = [
  ['2016', 'Joins Manchian Engineering College', 'Enrolled in Electrical Engineering, driven by a childhood curiosity about how electricity works.'],
  ['2020', 'Graduates with B.E. in Electrical Engineering', 'Completed his degree with a specialization in residential electrical systems and safety.'],
  ['2020', 'Returns to Tuni, Founds DP Home Electric Services', 'Instead of a corporate desk, chose to serve his hometown. Started with a small team and a big promise.'],
  ['2021', 'First 100 Customers Served', 'Quality work, honest pricing, and the 1 Month warranty made customers return and refer.'],
  ['2022', 'Team Grows to 10 Verified Workers', 'Expanded to cover more areas around Tuni. Each worker personally trained and verified.'],
  ['2023', '500+ Happy Customers', 'Became one of the most-booked home electrician services in Tuni with a 4.8-star average rating.'],
  ['2024', 'Launched Digital Booking Platform', 'Customers can book, pay, and track services from anywhere.'],
  ['2025', '50+ Workers, Covering East Godavari', 'Serving Tuni, Peddapuram, Rajanagaram and beyond while keeping the mission unchanged.'],
]

const stats = [
  { value: 500, suffix: '+', label: 'Happy Customers' },
  { value: 50, suffix: '+', label: 'Expert Workers' },
  { value: 3, suffix: ' Months', label: 'Warranty On All Jobs' },
  { value: 4.8, suffix: '', label: 'Average Rating' },
]

const values = [
  [Zap, 'Safety First', 'Every job follows practical electrical safety standards. No shortcuts, ever.'],
  [IndianRupee, 'Fair Pricing', 'Transparent quotes before work begins. No hidden charges or surprise bills.'],
  [ShieldCheck, 'Warranty Always', '1 Month warranty on every completed job. If it fails, we fix it.'],
]

const howItWorks = [
  ['1', 'Choose a Service', 'Browse 50+ electrical services from fan installation to full house wiring.'],
  ['2', 'Schedule & Pay', 'Pick your date, time slot, and pay via UPI. Instant confirmation.'],
  ['3', 'Expert Arrives', 'A verified electrician reaches your home at the scheduled time.'],
  ['4', 'Done + 1M Warranty', 'Work completed. A 1 Month warranty certificate is issued on every repair.'],
]

const whyChoose = [
  [UserCheck, 'Verified Workers', 'All workers are ID-verified, background-checked, and personally trained by Dilip.'],
  [CalendarCheck, 'Same-Day Service', 'Book before 2 PM for same-day service in Tuni. Emergency slots available.'],
  [BadgeCheck, 'Transparent Pricing', 'Exact price shown before any work begins. Zero hidden charges or surprise bills.'],
  [ShieldCheck, '1 Month Warranty', 'Every completed repair comes with a 1 Month warranty backed by our word.'],
]

export default function About() {
  const [workers, setWorkers] = useState([])
  const [loadingTeam, setLoadingTeam] = useState(Boolean(db && isFirebaseConfigured))

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => setLoadingTeam(false))
      return undefined
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'workers'), where('isActive', '==', true)),
      (snapshot) => {
        setWorkers(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).slice(0, 8))
        setLoadingTeam(false)
      },
      () => {
        setWorkers([])
        setLoadingTeam(false)
      },
    )
    return unsubscribe
  }, [])

  return (
    <>
      <Helmet>
        <title>About Us | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta
          name="description"
          content="DP Home Electric Services - Founded by Manepalli Dilip Kumar, a Manchian Engineering graduate turned entrepreneur. Trusted electricians in Tuni, AP with 1 Month warranty."
        />
      </Helmet>

      <main className="bg-surface">
        <section className="bg-navy px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="eyebrow text-amber-400">
              Our Story
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-3 max-w-3xl font-display text-4xl font-extrabold text-white sm:text-5xl"
            >
              {COMPANY.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="mt-4 max-w-2xl text-base leading-8 text-white/75"
            >
              From an engineering student to building Tuni's most trusted electrical service, one repair at a time.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              className="mt-5 flex flex-wrap items-center gap-5 text-sm text-amber-400"
            >
              <span className="flex items-center gap-1.5"><MapPin size={15} /> {COMPANY.location}</span>
              <span className="flex items-center gap-1.5"><GraduationCap size={15} /> Est. {COMPANY.founded}</span>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <div className="card p-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-extrabold text-white shadow-amber">
                {FOUNDER.initials}
              </div>
              <h2 className="mt-5 font-display text-2xl font-extrabold leading-tight text-navy">{FOUNDER.name}</h2>
              <p className="mt-1 text-sm font-bold text-amber-600">{FOUNDER.role}</p>
              <div className="mt-5 space-y-3 border-t border-surface-border pt-5">
                <Info icon={GraduationCap}>
                  <strong className="text-navy">{FOUNDER.degree}</strong>
                  <br />{FOUNDER.college}
                </Info>
                <Info icon={MapPin}>{COMPANY.fullLocation}</Info>
                <Info icon={Phone}>
                  <a href={`tel:${COMPANY.phone}`} className="font-semibold text-amber-600 hover:text-amber-700">
                    {COMPANY.phone}
                  </a>
                </Info>
              </div>
              <a
                href={`https://wa.me/${COMPANY.whatsapp}?text=Hi Dilip, I need electrical service in Tuni`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6 w-full"
              >
                WhatsApp Dilip
              </a>
            </div>

            <div className="card p-8">
              <p className="eyebrow">The Founder's Journey</p>
              <h3 className="section-title mt-2">From Classroom to Community</h3>
              {[
                'Manepalli Dilip Kumar grew up in Tuni, Andhra Pradesh, a town where unreliable electrical work was a daily frustration for families. Watching neighbours struggle with faulty wiring, unsafe switches, and overpriced contractors planted a seed that would shape his entire future.',
                'He pursued his passion at Manchian Engineering College, where he earned his degree in Electrical Engineering. More than textbooks, it was the hands-on labs and real-world field projects that convinced him: the real classroom was in the homes of ordinary people.',
                'After graduating, instead of taking a corporate job far from home, Dilip came back to Tuni with a simple mission: give every home access to skilled, honest, and warranty-backed electrical services. In 2020, he founded DP Home Electric Services and has not looked back since.',
                'Today, DP Home Electric Services serves hundreds of families across Tuni and nearby areas. Every job comes with a 1 Month warranty, transparent pricing, and the same personal care that Dilip showed on his very first assignment.',
              ].map((para) => (
                <p key={para} className="mt-4 text-sm leading-7 text-gray-600">{para}</p>
              ))}
              <blockquote className="mt-6 border-l-4 border-amber-400 pl-5">
                <Quote className="mb-2 text-amber-400" size={20} />
                <p className="text-sm italic leading-7 text-gray-600">{FOUNDER.quote}</p>
                <footer className="mt-2 text-xs font-bold text-amber-600">- {FOUNDER.name}, Founder</footer>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="eyebrow">Milestones</p>
              <h2 className="section-title mt-2">The Journey</h2>
            </div>
            <div className="mt-10">
              {timeline.map(([year, title, description], index) => (
                <motion.div
                  key={`${year}-${title}`}
                  className="relative pb-8 pl-10 last:pb-0"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                >
                  {index < timeline.length - 1 && <div className="absolute left-[11px] top-6 h-full w-0.5 bg-amber-100" />}
                  <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-white bg-primary shadow-amber" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-600">{year}</span>
                  <h3 className="mt-1 font-display font-bold text-navy">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => <CountUpStat key={stat.label} {...stat} />)}
          </div>
        </section>

        <Section title="Our Mission & Values" eyebrow="What We Stand For" white>
          <div className="grid gap-5 md:grid-cols-3">
            {values.map(([Icon, title, body]) => (
              <motion.div key={title} className="rounded-3xl border border-amber-100 bg-amber-50 p-6" whileHover={{ y: -4 }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title="How It Works" eyebrow="Simple Process">
          <div className="relative grid gap-8 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden border-t-2 border-dashed border-amber-200 md:block" />
            {howItWorks.map(([step, title, body]) => (
              <motion.div
                key={step}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-lg font-bold text-white shadow-card">
                  {step}
                </div>
                <h3 className="mt-4 font-display font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{body}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section title="Why Choose DP Home Electric?" eyebrow="Our Promise" white>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map(([Icon, title, body]) => (
              <motion.div key={title} className="card cursor-default p-6" whileHover={{ y: -4 }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-primary">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{body}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">The Team</p>
              <h2 className="section-title mt-2">Our Workers</h2>
              <p className="mt-2 text-sm text-gray-500">Every worker is personally verified and trained by Manepalli Dilip Kumar.</p>
            </div>
            <Link to="/services" className="btn-primary shrink-0">Book a Service <ArrowRight size={17} /></Link>
          </div>
          {loadingTeam ? (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="card p-5 text-center">
                  <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-gray-200" />
                  <div className="mx-auto mt-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : workers.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-dashed border-surface-border bg-white p-8 text-center text-sm text-gray-400">
              Team information coming soon.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {workers.map((worker) => (
                <motion.article key={worker.id} className="card p-5 text-center" whileHover={{ y: -4 }}>
                  {worker.photoURL ? (
                    <img src={worker.photoURL} alt={worker.name} className="mx-auto h-20 w-20 rounded-full object-cover" loading="lazy" width="80" height="80" />
                  ) : (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-white">
                      {worker.name?.charAt(0)?.toUpperCase() || 'W'}
                    </div>
                  )}
                  <h3 className="mt-3 text-sm font-semibold text-navy">{worker.name}</h3>
                  <span className="mt-1 inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {worker.specialization || 'Electrical services'}
                  </span>
                  <p className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Star size={11} fill="currentColor" className="text-amber-400" />
                    {Number(worker.rating || 4.8).toFixed(1)}
                  </p>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-3xl bg-primary p-10 text-center shadow-amber">
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              Ready for safe, reliable electrical service?
            </h2>
            <p className="mt-2 text-sm text-white/85">Same-day service in Tuni. 1 Month warranty guaranteed.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/services" className="rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-navy shadow transition hover:bg-amber-50 active:scale-[0.97]">
                Book a Service <ArrowRight size={16} className="inline" />
              </Link>
              <a href={`tel:${COMPANY.phone}`} className="rounded-2xl border-2 border-white/60 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white hover:text-navy active:scale-[0.97]">
                Call {COMPANY.phone}
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function Info({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3 text-sm text-gray-600">
      <Icon className="mt-0.5 shrink-0 text-amber-500" size={16} />
      <span>{children}</span>
    </div>
  )
}

function CountUpStat({ value, suffix, label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return undefined
    const duration = 900
    const start = performance.now()
    let frame = 0
    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1)
      setCount(Number(value) * progress)
      if (progress < 1) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [inView, value])

  const display = value % 1 === 0 ? Math.round(count) : count.toFixed(1)

  return (
    <div ref={ref} className="card p-6 text-center">
      <p className="font-display text-4xl font-extrabold text-navy">{display}{suffix}</p>
      <p className="mt-2 text-sm leading-5 text-gray-500">{label}</p>
    </div>
  )
}

function Section({ eyebrow, title, children, white = false }) {
  return (
    <section className={`${white ? 'bg-white' : ''} px-4 py-14 sm:px-6`}>
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="section-title mt-2">{title}</h2>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}
