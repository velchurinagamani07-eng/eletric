import { Heart } from 'lucide-react'
import { useWishlistStore } from '../store/wishlistStore'

export default function WishlistButton({ service, className = '' }) {
  const ids = useWishlistStore((state) => state.ids)
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)
  const id = String(service.serviceId || service.id || service.slug)
  const active = ids.includes(id)

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleWishlist(service)
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition active:scale-90 ${className}`}
      aria-label={active ? `Remove ${service.name} from wishlist` : `Add ${service.name} to wishlist`}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={active ? 'fill-red-600 text-red-600' : 'text-white'} size={18} />
    </button>
  )
}
