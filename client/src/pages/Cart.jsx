import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { getServiceImage, handleImageFallback } from '../utils/defaultImages'

export default function Cart() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const navigate = useNavigate()
  const total = items.reduce((sum, item) => sum + Number(item.basePrice || 0) * Number(item.quantity || 1), 0)

  const checkout = () => {
    if (!items.length) {
      toast.error('Add a service before checkout.')
      return
    }
    const first = items.find((item) => item.itemType !== 'product')
    if (!first) {
      toast.error('Add a service to checkout with products.')
      navigate('/services')
      return
    }
    navigate(`/checkout?service=${first.slug || first.id}`)
  }

  return (
    <>
      <Helmet>
        <title>Cart | Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content="Review selected electrical services and proceed to checkout." />
      </Helmet>
      <main className="bg-gray-50 py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShoppingCart size={23} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Cart</p>
              <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white">Selected items</h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
              <p className="font-bold text-gray-950 dark:text-white">Your cart is empty.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/services" className="btn-primary">Browse Services</Link>
                <Link to="/products" className="btn-secondary">Browse Products</Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
              <section className="grid gap-4">
                {items.map((item) => (
                  <article key={item.id} className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:grid-cols-[120px_1fr_auto]">
                    <img src={item.imageURL || getServiceImage(item)} alt="" onError={handleImageFallback} className="h-24 w-full rounded-lg object-cover sm:w-28" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-950 dark:text-white">{item.name}</h2>
                        <span className="badge bg-amber-100 text-amber-800">{item.itemType === 'product' ? 'Product' : 'Service'}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.shortDescription}</p>
                      <p className="mt-2 text-sm font-extrabold text-amber-600">{currency(item.basePrice)}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                      aria-label="Remove service"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))}
              </section>

              <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                <p className="text-sm font-bold text-gray-950 dark:text-white">Summary</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm dark:border-white/10">
                  <span className="text-gray-500">Estimated total</span>
                  <span className="text-xl font-extrabold text-gray-950 dark:text-white">{currency(total)}</span>
                </div>
                <button type="button" className="btn-primary mt-5 w-full" onClick={checkout}>
                  Proceed to Checkout <ArrowRight size={17} />
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
