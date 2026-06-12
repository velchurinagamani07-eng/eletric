import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Award, MapPin, ShieldCheck, Users, Wrench } from 'lucide-react'
import { settings, workers } from '../data/catalog'
import { handleImageFallback } from '../utils/defaultImages'

export default function About() {
  const visibleWorkers = workers.filter((worker) => worker.isActive)

  return (
    <>
      <Helmet>
        <title>About Us - Home Electric Services Tuni | M Dileep Kumar</title>
        <meta
          name="description"
          content="About Home Electric Services in Tuni, owned by M Dileep Kumar. Trusted home electricians for safe repairs, installations and wiring."
        />
      </Helmet>
      <main className="bg-gray-50 dark:bg-gray-950">
        <section className="bg-navy-900 px-4 py-16 text-white sm:px-6">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-400">About</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">About Home Electric Services</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
              A Tuni-focused home electrical service team led by {settings.owner}, built for practical,
              transparent and warranty-backed service visits.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <MapPin className="text-amber-600" size={24} />
            <h2 className="mt-4 text-2xl font-extrabold text-navy-900 dark:text-white">Our story</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
              Home Electric Services helps families in Tuni and surrounding areas book dependable electricians
              without confusion. The mission is simple: safe electrical work, clear pricing, fast communication,
              and a 3-month warranty on completed repairs.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['10+ Years', 'Electrical service experience', Award],
              ['500+', 'Happy customers', Users],
              ['50+', 'Expert workers', Wrench],
              ['3 Months', 'Warranty support', ShieldCheck],
            ].map(([value, label, Icon]) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <Icon className="text-amber-600" size={22} />
                <p className="mt-3 text-2xl font-extrabold text-navy-900 dark:text-white">{value}</p>
                <p className="mt-1 text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Team</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Verified service workers</h2>
            </div>
            <Link to="/booking" className="btn-primary">Book a Service</Link>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleWorkers.map((worker) => (
              <article key={worker.uid} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                {worker.photoURL && (
                  <img
                    src={worker.photoURL}
                    alt={worker.name}
                    onError={(event) => handleImageFallback(event)}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                )}
                <h3 className="mt-4 font-bold text-navy-900 dark:text-white">{worker.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{worker.specialization}</p>
                <p className="mt-3 text-sm font-semibold text-amber-700">{worker.totalJobsCompleted}+ jobs completed</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

