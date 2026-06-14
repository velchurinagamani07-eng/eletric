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
    <article className="group h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-gray-900">
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
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-950 dark:text-white sm:text-base">{service.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 sm:text-sm sm:leading-6">{service.shortDescription}</p>
          </div>
          <span className="badge w-fit shrink-0 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 dark:bg-amber-500/15 dark:text-amber-200 sm:px-3 sm:py-1 sm:text-xs">
            {currency(service.basePrice)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500 sm:mt-4 sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <Clock size={14} /> {service.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={14} /> 3 Month Warranty
          </span>
        </div>
        <div className="mt-4 flex gap-1.5 sm:gap-2">
          <Link to={bookingPath} className="btn-primary min-h-10 flex-1 px-2 py-2 text-xs sm:min-h-11 sm:px-6 sm:py-3 sm:text-sm">
            Book Now
          </Link>
          <button
            type="button"
            className="btn-secondary min-h-10 px-2 py-2 sm:min-h-11 sm:px-3"
            aria-label={`Add ${service.name} to cart`}
            onClick={() => {
              addItem(service)
              toast.success(`${service.name} added to cart.`)
            }}
          >
            <ShoppingCart size={17} />
          </button>
          <Link to={detailPath} className="btn-secondary min-h-10 px-2 py-2 sm:min-h-11 sm:px-3" aria-label={`View ${service.name}`}>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  )
}
