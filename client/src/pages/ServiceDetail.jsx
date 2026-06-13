import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, IndianRupee, ShieldCheck, ShoppingCart } from 'lucide-react'
import { timeSlots } from '../data/catalog'
import ElectricLoader from '../components/ElectricLoader'
import { currency } from '../utils/format'
import { getServiceImage, handleImageFallback } from '../utils/defaultImages'
import { useCartStore } from '../store/cartStore'
import { useServices } from '../hooks/useServices'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { services, loading } = useServices({ onlyActive: false })
  const service = useMemo(() => services.find((item) => item.slug === slug || item.id === slug), [services, slug])
  const addItem = useCartStore((state) => state.addItem)

  if (!service && loading) {
    return <ElectricLoader compact />
  }

  if (!service) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Service not found</h1>
        <Link to="/services" className="btn-primary mt-5">
          Back to Services
        </Link>
      </main>
    )
  }

  const totalEstimate = service.labor + service.partsEstimate

  return (
    <>
      <Helmet>
        <title>{service.name} | DP Home Electric Services</title>
        <meta name="description" content={service.description} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: service.name,
            description: service.description,
            offers: { '@type': 'Offer', price: service.basePrice, priceCurrency: 'INR' },
          })}
        </script>
      </Helmet>

      <main className="bg-gray-50 py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link to="/services" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-amber-600 dark:text-gray-300">
            <ArrowLeft size={17} /> Services / {service.name}
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="overflow-hidden rounded-lg bg-gray-200 shadow-xl">
                <img
                  src={getServiceImage(service)}
                  alt={service.name}
                  onError={handleImageFallback}
                  className="aspect-[16/11] w-full object-cover"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(service.images?.length ? service.images : [service.imageURL, service.imageURL, service.imageURL]).slice(0, 3).map((src, index) => (
                  <img
                    key={`${service.id}-gallery-${src || index}`}
                    src={src || getServiceImage(service)}
                    alt={`${service.name} gallery ${index + 1}`}
                    onError={handleImageFallback}
                    className="aspect-[4/3] rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-7">
              <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                <ShieldCheck size={14} className="mr-1" /> 3-Month Warranty Included
              </span>
              <h1 className="mt-4 text-3xl font-extrabold text-gray-950 dark:text-white">{service.name}</h1>
              <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{service.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-500/10">
                  <IndianRupee className="text-amber-600" size={20} />
                  <p className="mt-2 text-xs text-gray-500">Starting price</p>
                  <p className="text-lg font-extrabold text-gray-950 dark:text-white">{currency(service.basePrice)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-500/10">
                  <Clock className="text-blue-600" size={20} />
                  <p className="mt-2 text-xs text-gray-500">Duration</p>
                  <p className="text-lg font-extrabold text-gray-950 dark:text-white">{service.duration}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
                  <CalendarDays className="text-emerald-600" size={20} />
                  <p className="mt-2 text-xs text-gray-500">Slots</p>
                  <p className="text-lg font-extrabold text-gray-950 dark:text-white">6 daily</p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="font-bold text-gray-950 dark:text-white">What's included</h2>
                <div className="mt-3 grid gap-2">
                  {service.includes.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle2 className="text-emerald-500" size={17} /> {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-lg border border-gray-100 dark:border-white/10">
                {[
                  ['Base price', currency(service.basePrice)],
                  ['Labor estimate', currency(service.labor)],
                  ['Parts estimate', currency(service.partsEstimate)],
                  ['Typical total range', currency(totalEstimate)],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      index === 3
                        ? 'bg-gray-950 font-bold text-white'
                        : 'border-b border-gray-100 text-gray-600 dark:border-white/10 dark:text-gray-300'
                    }`}
                  >
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h2 className="font-bold text-gray-950 dark:text-white">Available time slots</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {timeSlots.slice(0, 4).map((slot) => (
                    <span key={slot} className="rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:border-white/10 dark:text-gray-200">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link to={`/book/${service.id || service.slug}`} className="btn-primary w-full">
                  Book Now
                </Link>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => {
                    addItem(service)
                    toast.success(`${service.name} added to cart.`)
                  }}
                >
                  <ShoppingCart size={17} /> Add to Cart
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
