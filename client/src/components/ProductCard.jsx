import { Link } from 'react-router-dom'
import { Star, Plus, Minus, CheckCircle2, ShoppingBag } from 'lucide-react'
import { currency } from '../utils/format'
import { useCartStore } from '../store/cartStore'
import WishlistButton from './WishlistButton'
import { productPrice } from '../hooks/useProducts'

export default function ProductCard({ product }) {
  const price = productPrice(product)
  const hasDiscount = Number(product.salePrice || 0) > 0 && Number(product.salePrice) < Number(product.basePrice)
  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const decrementItem = useCartStore((state) => state.decrementItem)

  const cartId = `product-${product.id}`
  const qty = cartItems.find((item) => item.id === cartId)?.quantity || 0

  const add = () => {
    addItem({
      ...product,
      id: cartId,
      productId: product.id,
      itemType: 'product',
      basePrice: price,
      imageURL: product.imageURL || product.images?.[0] || '',
      shortDescription: product.shortDescription || product.brand || 'Electrical product',
    })
  }

  const remove = () => {
    decrementItem(cartId)
  }

  const imageSrc = product.imageURL || product.images?.[0] || ''

  return (
    <article className="w-[190px] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--primary-text)] shadow-card sm:w-[230px] transition hover:-translate-y-1 hover:border-red-900/50 hover:shadow-xl group select-none" draggable={false}>
      <Link to={`/products/${product.slug || product.id}`} draggable={false} className="relative block h-36 w-full sm:h-40 shrink-0 overflow-hidden bg-zinc-800 select-none">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            width="230"
            height="173"
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105 pointer-events-none select-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-gray-400">
            <ShoppingBag size={40} />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-white">
            Offer
          </span>
        )}
        <WishlistButton service={product} className="absolute right-2 top-2" />
      </Link>
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{product.brand || 'Home Electric'}</p>
        <Link to={`/products/${product.slug || product.id}`} className="mt-1 block">
          <h3 className="truncate text-sm font-bold text-[var(--primary-text)] hover:text-red-500 transition">{product.name}</h3>
        </Link>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--secondary-text)]">
          <Star size={12} fill="currentColor" className="text-red-500" />
          {product.rating > 0 ? `${Number(product.rating).toFixed(1)} (${product.totalReviews || 0})` : 'New'}
          {product.warranty && <span>| {product.warranty}</span>}
        </p>
        <p className="mt-2 text-sm font-extrabold text-[var(--primary-text)]">
          {currency(price)}
          {hasDiscount && (
            <span className="ml-2 text-xs font-semibold text-[var(--secondary-text)] line-through">{currency(product.basePrice)}</span>
          )}
        </p>
        
        <ul className="mt-2 space-y-1 min-h-[40px]">
          {(product.inclusions || product.includes || ['Copper core', 'ISI certified']).slice(0, 2).map((item) => (
            <li key={item} className="flex items-start gap-1 text-xs text-[var(--secondary-text)]">
              <CheckCircle2 className="mt-0.5 shrink-0 text-green-500" size={12} /> <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>

        {qty > 0 ? (
          <div className="mt-4 grid grid-cols-[36px_1fr_36px] overflow-hidden rounded-lg border border-red-700 bg-red-600/10 text-sm font-extrabold text-white">
            <button type="button" onClick={remove} className="grid h-10 place-items-center" aria-label={`Remove ${product.name}`}>
              <Minus size={15} />
            </button>
            <span className="grid place-items-center">{qty}</span>
            <button type="button" onClick={add} className="grid h-10 place-items-center" aria-label={`Add ${product.name}`}>
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button type="button" className="btn-secondary mt-4 h-10 w-full px-4 py-2" onClick={add}>
            Add
          </button>
        )}
      </div>
    </article>
  )
}
