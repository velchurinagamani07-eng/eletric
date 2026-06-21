import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Heart, ShoppingCart } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import { useServices } from '../hooks/useServices'
import { useCartStore } from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'

export default function MyWishlist() {
  const { services, loading } = useServices({ onlyActive: true })
  const wishlistIds = useWishlistStore((state) => state.ids)
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)
  const addItem = useCartStore((state) => state.addItem)
  const wishlistedServices = services.filter((service) => wishlistIds.includes(String(service.id || service.slug)))

  return (
    <>
      <Helmet>
        <title>My Wishlist | Home Electric Services</title>
        <meta name="description" content="Saved electrical services you want to book later." />
      </Helmet>

      <main className="min-h-screen bg-[#0A0A0A] py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">Customer</p>
              <h1 className="mt-2 text-2xl font-extrabold md:text-4xl">My Wishlist</h1>
              <p className="mt-2 text-sm text-gray-400">Saved services stay here until you are ready to book.</p>
            </div>
            <Link to="/services" className="btn-secondary w-full sm:w-auto">Browse Services</Link>
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-lg bg-zinc-900" />
              ))}
            </div>
          ) : wishlistedServices.length === 0 ? (
            <section className="mt-8 rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-8 text-center">
              <Heart className="mx-auto text-red-500" size={34} />
              <h2 className="mt-4 text-lg font-extrabold">Your wishlist is empty.</h2>
              <p className="mt-2 text-sm text-gray-400">Tap the heart on any service to save it here.</p>
              <Link to="/services" className="btn-primary mt-5">Find Services</Link>
            </section>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {wishlistedServices.map((service) => (
                <div key={service.id} className="relative">
                  <ServiceCard service={service} />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="btn-primary min-h-10 px-2 py-2 text-xs"
                      onClick={() => {
                        addItem(service)
                        toast.success(`${service.name} added to cart.`)
                      }}
                    >
                      <ShoppingCart size={15} /> Add
                    </button>
                    <button type="button" className="btn-secondary min-h-10 px-2 py-2 text-xs" onClick={() => toggleWishlist(service)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
