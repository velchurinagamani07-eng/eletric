import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, IndianRupee, ShieldCheck, ShoppingCart, Star } from 'lucide-react'
import { timeSlots } from '../data/catalog'
import ElectricLoader from '../components/ElectricLoader'
import { currency } from '../utils/format'
import { getServiceImage, handleImageFallback } from '../utils/defaultImages'
import { useCartStore } from '../store/cartStore'
import { useServices } from '../hooks/useServices'
import RecommendedServices from '../components/RecommendedServices'
import { recordServiceView } from '../utils/recommendations'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { services, loading } = useServices({ onlyActive: false })
  const service = useMemo(() => services.find((item) => item.slug === slug || item.id === slug), [services, slug])
  const [selectedImage, setSelectedImage] = useState('')
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (service) recordServiceView(service)
  }, [service])

  if (!service && loading) {
    return <ElectricLoader compact />
  }

  if (!service) {
    return (
      <main className="mx-auto max-w-3xl bg-[#0A0A0A] px-4 py-16 text-center text-white">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Link to="/services" className="btn-primary mt-5">
          Back to Services
        </Link>
      </main>
    )
  }

  const totalEstimate = service.labor + service.partsEstimate
  const galleryImages = (service.images?.length ? service.images : [service.imageURL || getServiceImage(service)]).filter(Boolean)
  const images = galleryImages.length ? galleryImages : [getServiceImage(service)]
  const mainImage = selectedImage || images[0]

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

      <main className="bg-[#0A0A0A] py-8 pb-36 text-white lg:py-10 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6">
          <Link to="/services" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-400">
            <ArrowLeft size={17} /> Services / {service.name}
          </Link>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="min-w-0">
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory no-scrollbar lg:hidden -mx-4 sm:-mx-6">
                {images.map((src, index) => (
                  <img
                    key={`${service.id}-mobile-gallery-${src || index}`}
                    src={src}
                    alt={`${service.name} photo ${index + 1}`}
                    onError={handleImageFallback}
                    className="aspect-square w-full max-w-full shrink-0 basis-full object-cover snap-center"
                  />
                ))}
              </div>
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-lg bg-zinc-900 shadow-xl">
                  <img
                    src={mainImage}
                    alt={service.name}
                    onError={handleImageFallback}
                    className="aspect-[16/11] w-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((src, index) => (
                      <button
                        type="button"
                        key={`${service.id}-gallery-${src || index}`}
                        onClick={() => setSelectedImage(src)}
                        className={`h-24 w-28 shrink-0 overflow-hidden rounded-lg border ${
                          mainImage === src ? 'border-red-600' : 'border-zinc-800'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${service.name} photo ${index + 1}`}
                          onError={handleImageFallback}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <section className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm sm:p-7">
              <span className="badge bg-red-600/15 text-red-400">
                <ShieldCheck size={14} className="mr-1" /> 1 Month Warranty Included
              </span>
              <h1 className="mt-4 break-words text-2xl font-extrabold text-white md:text-4xl">{service.name}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-gray-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star size={15} fill="currentColor" />
                  <span className="font-bold text-white">4.80</span>
                </span>
                <span>(2.5K bookings)</span>
                <span>•</span>
                <span>{service.duration}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-gray-300">{service.description}</p>

              <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-black/40 p-4">
                  <IndianRupee className="text-red-500" size={20} />
                  <p className="mt-2 text-xs text-gray-500">Starting price</p>
                  <p className="text-lg font-extrabold text-white">{currency(service.basePrice)}</p>
                </div>
                <div className="rounded-lg bg-black/40 p-4">
                  <Clock className="text-blue-600" size={20} />
                  <p className="mt-2 text-xs text-gray-500">Duration</p>
                  <p className="text-lg font-extrabold text-white">{service.duration}</p>
                </div>
                <div className="rounded-lg bg-black/40 p-4">
                  <CalendarDays className="text-emerald-600" size={20} />
                  <p className="mt-2 text-xs text-gray-500">Slots</p>
                  <p className="text-lg font-extrabold text-white">6 daily</p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="font-bold text-white">What's included</h2>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
                  {service.includes.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="text-emerald-500" size={17} /> {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
                {[
                  ['Base price', currency(service.basePrice)],
                  ['Labor estimate', currency(service.labor)],
                  ['Parts estimate', currency(service.partsEstimate)],
                  ['Typical total range', currency(totalEstimate)],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`flex min-w-0 items-center justify-between gap-3 px-4 py-3 text-sm ${
                      index === 3
                        ? 'bg-red-600 font-bold text-white'
                        : 'border-b border-zinc-800 text-gray-300'
                    }`}
                  >
                    <span className="min-w-0 break-words">{label}</span>
                    <span className="shrink-0">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h2 className="font-bold text-white">Available time slots</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {timeSlots.slice(0, 4).map((slot) => (
                    <span key={slot} className="rounded-lg border border-zinc-800 px-3 py-2 text-center text-xs font-semibold text-gray-300">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
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

              <RecommendedServices
                currentService={service}
                title="Complete Your Service With"
                subtitle="Related repairs customers often add with this booking."
              />
            </section>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-zinc-800 bg-black/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <button
              type="button"
              className="btn-secondary flex-1 min-h-12 px-4 py-2"
              onClick={() => {
                addItem(service)
                toast.success(`${service.name} added to cart.`)
              }}
            >
              <ShoppingCart size={17} /> Add
            </button>
            <Link to={`/book/${service.id || service.slug}`} className="btn-primary flex-1 min-h-12 px-5">
              Book Now
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
