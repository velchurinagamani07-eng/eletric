import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Clock, ShoppingCart, ShieldCheck } from 'lucide-react'
import { currency } from '../utils/format'
import { getDefaultImage, getServiceImage, handleImageFallback } from '../utils/defaultImages'
import { useCartStore } from '../store/cartStore'

export default function ServiceCard({ service }) {
  const imageSrc = getServiceImage(service)
  const detailPath = `/services/${service.id || service.slug}`
  const bookingPath = `/book/${service.id || service.slug}`
  const addItem = useCartStore((state) => state.addItem)

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-gray-900">
      <Link to={detailPath} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageSrc}
            alt={service.name}
            onError={(event) => handleImageFallback(event, getDefaultImage(service.category))}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-950 dark:text-white">{service.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500">{service.shortDescription}</p>
          </div>
          <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
            {currency(service.basePrice)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Clock size={14} /> {service.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={14} /> 3 Month Warranty
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={bookingPath} className="btn-primary flex-1">
            Book Now
          </Link>
          <button
            type="button"
            className="btn-secondary px-3"
            aria-label={`Add ${service.name} to cart`}
            onClick={() => {
              addItem(service)
              toast.success(`${service.name} added to cart.`)
            }}
          >
            <ShoppingCart size={17} />
          </button>
          <Link to={detailPath} className="btn-secondary px-3" aria-label={`View ${service.name}`}>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  )
}
