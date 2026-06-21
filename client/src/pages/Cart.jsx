import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { getServiceImage, handleImageFallback } from '../utils/defaultImages'
import RecommendedServices from '../components/RecommendedServices'

export default function Cart() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const navigate = useNavigate()
  const total = items.reduce((sum, item) => sum + Number(item.basePrice || item.price || 0) * Number(item.quantity || 1), 0)

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
        <title>Cart | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content="Review selected electrical services and proceed to checkout." />
      </Helmet>
      <main className="min-h-screen bg-[#0A0A0A] py-8 text-white lg:py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/15 text-red-500">
              <ShoppingCart size={23} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-500">Cart</p>
              <h1 className="text-2xl font-extrabold md:text-3xl">Selected items</h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center shadow-sm sm:p-10">
              <p className="font-bold text-white">Your cart is empty.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/services" className="btn-primary">Browse Services</Link>
                <Link to="/products" className="btn-secondary">Browse Products</Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
              <section className="grid gap-4">
                {items.map((item) => (
                  <article key={item.id} className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-sm sm:grid-cols-[120px_1fr_auto]">
                    <img src={item.imageURL || getServiceImage(item)} alt="" onError={handleImageFallback} className="h-24 w-full rounded-lg object-cover sm:w-28" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-white">{item.name}</h2>
                        <span className="badge bg-red-600/15 text-red-400">{item.itemType === 'product' ? 'Product' : 'Service'}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{item.shortDescription}</p>
                      <p className="mt-2 text-sm font-extrabold text-red-400">{currency(item.basePrice || item.price)}</p>
                      <div className="mt-3 inline-grid grid-cols-[34px_44px_34px] overflow-hidden rounded-lg border border-zinc-700 bg-black/30 text-sm font-extrabold text-white">
                        <button type="button" className="grid h-9 place-items-center" aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.id, Number(item.quantity || 1) - 1)}>
                          <Minus size={15} />
                        </button>
                        <span className="grid place-items-center">{item.quantity || 1}</span>
                        <button type="button" className="grid h-9 place-items-center" aria-label={`Increase ${item.name}`} onClick={() => updateQuantity(item.id, Number(item.quantity || 1) + 1)}>
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-500 hover:bg-red-600/10"
                      aria-label="Remove service"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))}
                <RecommendedServices title="Add these too?" subtitle="Quick add complementary services before checkout." />
              </section>

              <aside className="h-fit rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm lg:sticky lg:top-24">
                <p className="text-sm font-bold text-white">Summary</p>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm">
                  <span className="text-gray-400">Estimated total</span>
                  <span className="text-xl font-extrabold text-white">{currency(total)}</span>
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
