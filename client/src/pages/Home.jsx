import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  ShieldCheck,
  Star,
  UserCheck,
  Wrench,
  Zap,
} from 'lucide-react'
import FestivalBanner from '../components/Banners/FestivalBanner'
import PromoBanner from '../components/Banners/PromoBanner'
import HeroBanner from '../components/HeroBanner'
import ServiceCard from '../components/ServiceCard'
import { settings, testimonials } from '../data/catalog'
import { useServiceCategories, useServices } from '../hooks/useServices'

const steps = [
  {
    title: 'Book',
    text: 'Choose service, address, date, time slot and coupon in a guided flow.',
    icon: CalendarCheck,
  },
  {
    title: 'Assign Expert',
    text: 'Admin assigns a verified electrician matched to your service category.',
    icon: UserCheck,
  },
  {
    title: 'Service Done',
    text: 'Track completion photo, receipt, warranty and follow-up coupon.',
    icon: Wrench,
  },
]

const features = [
  ['Tuni local team', 'Fast support for Tuni and nearby areas.', Zap],
  ['Verified workers', 'Admin-created worker accounts with service specialization.', UserCheck],
  ['Warranty support', '3-month warranty certificate included in receipts.', ShieldCheck],
  ['Transparent prices', 'Starting prices and itemized payment receipts.', ClipboardCheck],
  ['Real-time updates', 'Booking, payment and job status notifications.', CheckCircle2],
  ['Human help', 'WhatsApp, call button and assistant chat are always reachable.', Headphones],
]

export default function Home() {
  const { services: liveServices } = useServices({ onlyActive: true })
  const { categories: liveCategories } = useServiceCategories({ includeAll: false })
  const featuredServices = liveServices.slice(0, 8)

  return (
    <>
      <Helmet>
        <title>Home Electric Services - Expert Electricians in Tuni | M Dileep Kumar</title>
        <meta
          name="description"
          content="Professional home electrical services in Tuni. Fan installation, house wiring, AC fitting, inverter repair. 3-month warranty. Call +91 9493745479."
        />
        <meta
          name="keywords"
          content="electrician Tuni, home electric service, fan installation Tuni, house wiring, electrical repair"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: settings.companyName,
            telephone: `+91${settings.phone}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Tuni',
              addressRegion: 'Andhra Pradesh',
              addressCountry: 'IN',
            },
            description: 'Expert home electrical services',
            areaServed: 'Tuni',
          })}
        </script>
      </Helmet>

      <PromoBanner />
      <HeroBanner />
      <FestivalBanner />

      <section className="bg-gray-50 py-14 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Services</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">
                Book trusted electrical work
              </h2>
            </div>
            <Link to="/services" className="btn-secondary">
              View All <ArrowRight size={17} />
            </Link>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {liveCategories.slice(0, 7).map((category) => (
              <span
                key={category.id}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200"
              >
                {category.name}
              </span>
            ))}
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((service) => (
              <ServiceCard service={service} key={service.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">How it works</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">
                From booking to warranty, every step is trackable.
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
                Customers, workers and admins each get the right panel, so assignments, payments, work photos,
                notifications, coupons and receipts stay organized.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-white/10 dark:bg-gray-900"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Icon size={22} />
                    </span>
                    <h3 className="mt-4 font-bold text-navy-900 dark:text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{step.text}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Why choose us</p>
          <h2 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Built for reliable home visits</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, text, Icon]) => (
              <article key={title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-white/10 dark:bg-gray-900">
                <Icon className="text-amber-600" size={22} />
                <h3 className="mt-4 font-bold text-navy-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white py-14 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Testimonials</p>
          <h2 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Customers trust the follow-through</h2>
          <div className="mt-7 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {testimonials.map((item) => (
              <article
                key={item.id}
                className="w-[310px] shrink-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900"
              >
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: item.rating }).map((_, index) => (
                    <Star key={`${item.id}-star-${index}`} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">"{item.text}"</p>
                <div className="mt-5 border-t border-gray-100 pt-4 text-sm dark:border-white/10">
                  <p className="font-bold text-navy-900 dark:text-white">{item.name}</p>
                  <p className="text-gray-500">
                    {item.service} | {item.date}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-900 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-amber-400">
              <Zap size={17} /> Same-day help in Tuni
            </p>
            <h2 className="mt-2 text-3xl font-extrabold">Ready to book?</h2>
          </div>
          <Link to="/booking" className="btn-primary">
            Get Same-day Service <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
