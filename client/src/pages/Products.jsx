import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowRight, PackageSearch, Search, ShoppingCart, SlidersHorizontal } from 'lucide-react'
import { useProductCategories, useProducts, productPrice } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { DEFAULT_SERVICE_IMAGE, handleImageFallback } from '../utils/defaultImages'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const { products, loading, error } = useProducts({ categoryId })
  const { categories } = useProductCategories()
  const addItem = useCartStore((state) => state.addItem)

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return products
    return products.filter((product) =>
      [product.name, product.brand, product.shortDescription].some((value) => String(value || '').toLowerCase().includes(needle)),
    )
  }, [products, query])

  const addProduct = (product) => {
    addItem({
      ...product,
      id: `product-${product.id}`,
      productId: product.id,
      itemType: 'product',
      basePrice: productPrice(product),
      imageURL: product.imageURL || product.images?.[0] || '',
      shortDescription: product.shortDescription || product.brand || 'Electrical product',
    })
    toast.success('Product added to cart.')
  }

  return (
    <>
      <Helmet>
        <title>Electrical Products | DP Home Electric Services</title>
        <meta name="description" content="Shop electrical products and service-ready parts from DP Home Electric Services." />
      </Helmet>

      <main className="bg-[var(--page-bg)] py-10 text-[var(--primary-text)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Products</p>
              <h1 className="mt-3 font-heading text-4xl font-extrabold text-[var(--primary-text)] sm:text-5xl">
                Electrical essentials for safer homes
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--secondary-text)]">
                Browse parts, fittings, and accessories that pair naturally with Home Electric service bookings.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:grid-cols-[1fr_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  className="field min-h-12 pl-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search MCB, bulb, wire..."
                />
              </label>
              <label className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select className="field min-h-12 pl-10" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {error && <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

          <section className="mt-8">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={`product-skeleton-${index}`} className="h-80 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-white/10" />
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-14 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-900">
                <PackageSearch className="mx-auto text-amber-600" size={36} />
                <h2 className="mt-4 text-xl font-extrabold text-[#0F172A] dark:text-white">No products yet</h2>
                <p className="mt-2 text-sm text-[#475569] dark:text-gray-300">
                  Add products from the admin panel to publish the store catalog.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 rounded-2xl bg-[#0F172A] p-6 text-white sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-400">Need installation too?</p>
              <h2 className="mt-1 text-2xl font-extrabold">Book an electrician with your products.</h2>
            </div>
            <Link to="/services" className="btn-primary mt-5 sm:mt-0">
              View Services <ArrowRight size={17} />
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}
