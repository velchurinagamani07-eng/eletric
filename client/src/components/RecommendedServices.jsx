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
import ScrollRow from './ScrollRow'

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
    <section className={`py-6 ${className}`}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-[var(--primary-text)] sm:text-xl">{title}</h2>
          {subtitle ? <p className="text-xs text-[var(--secondary-text)]">{subtitle}</p> : null}
        </div>
        <Link to="/services" className="text-xs font-bold text-[var(--primary-accent)] hover:underline">
          View all
        </Link>
      </div>
      <ScrollRow className="-mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((service) => {
          const price = Number(service.salePrice || service.basePrice || service.price || 0)
          return (
            <article key={service.id || service.slug} className="w-[168px] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] sm:w-[210px] select-none" draggable={false}>
              <Link to={`/services/${service.slug || service.id}`} draggable={false} className="relative block aspect-square overflow-hidden bg-[var(--card-bg)] select-none">
                <img
                  src={getServiceImage(service)}
                  alt={service.name}
                  loading="lazy"
                  draggable={false}
                  onError={(event) => handleImageFallback(event, getDefaultImage(service.category))}
                  className="h-full w-full object-cover pointer-events-none select-none"
                />
                <WishlistButton service={service} className="absolute right-2 top-2" />
              </Link>
              <div className="p-3">
                <h3 className="line-clamp-2 min-h-10 text-sm font-bold text-[var(--primary-text)]">{service.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--secondary-text)]">
                  <Star size={12} fill="currentColor" className="text-[var(--primary-accent)]" /> {Number(service.rating || 4.8).toFixed(1)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-[var(--primary-accent)]">{currency(price)}</span>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-accent)] text-white transition hover:bg-[var(--primary-accent-hover)]"
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
      </ScrollRow>
    </section>
  )
}

function SkeletonRow() {
  return (
    <div className="mt-8 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-56 w-40 shrink-0 animate-pulse rounded-lg bg-zinc-900 sm:w-52" />
      ))}
    </div>
  )
}
