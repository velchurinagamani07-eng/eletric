import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Star } from 'lucide-react'
import { useMemo } from 'react'
import { useServices } from '../hooks/useServices'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { getDefaultImage, getServiceImage, handleImageFallback } from '../utils/defaultImages'
import { getRecommendedServices } from '../utils/recommendations'
import WishlistButton from './WishlistButton'

export default function RecommendedServices({
  currentService = null,
  title = 'Customers Also Booked',
  subtitle = '',
  limit = 4,
  className = '',
}) {
  const { services, loading } = useServices({ onlyActive: true })
  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)

  const items = useMemo(
    () => getRecommendedServices({ currentService, services, cartItems, limit }),
    [cartItems, currentService, limit, services],
  )

  if (loading) return <SkeletonRow />
  if (!items.length) return null

  return (
    <section className={`mt-8 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white md:text-xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
        </div>
        <Link to="/services" className="hidden text-sm font-bold text-red-400 hover:text-red-300 sm:inline-flex">
          View all
        </Link>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
        {items.map((service) => {
          const price = Number(service.salePrice || service.basePrice || service.price || 0)
          return (
            <article key={service.id || service.slug} className="w-[168px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 sm:w-[210px]">
              <Link to={`/services/${service.slug || service.id}`} className="relative block aspect-square overflow-hidden bg-zinc-800">
                <img
                  src={getServiceImage(service)}
                  alt={service.name}
                  loading="lazy"
                  onError={(event) => handleImageFallback(event, getDefaultImage(service.category))}
                  className="h-full w-full object-cover"
                />
                <WishlistButton service={service} className="absolute right-2 top-2" />
              </Link>
              <div className="p-3">
                <h3 className="line-clamp-2 min-h-10 text-sm font-bold text-white">{service.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-500">
                  <Star size={12} fill="currentColor" className="text-red-500" /> {Number(service.rating || 4.8).toFixed(1)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-red-400">{currency(price)}</span>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                    aria-label={`Add ${service.name}`}
                    onClick={() => {
                      addItem(service)
                      toast.success(`${service.name} added to cart.`)
                    }}
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SkeletonRow() {
  return (
    <div className="mt-8 flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-56 w-40 shrink-0 animate-pulse rounded-lg bg-zinc-900 sm:w-52" />
      ))}
    </div>
  )
}
