import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { ArrowLeft, BadgeCheck, PackageCheck, ShieldCheck, ShoppingCart, Star } from 'lucide-react'
import { getProductBySlug, productPrice } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { DEFAULT_SERVICE_IMAGE, handleImageFallback } from '../utils/defaultImages'

export default function ProductDetail() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    let alive = true
    Promise.resolve().then(() => {
      if (alive) setLoading(true)
    })
    getProductBySlug(slug)
      .then((nextProduct) => {
        if (!alive) return
        setProduct(nextProduct)
        setSelectedImage(nextProduct?.imageURL || nextProduct?.images?.[0] || DEFAULT_SERVICE_IMAGE)
        setError(nextProduct ? '' : 'Product not found.')
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || 'Unable to load product.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [slug])

  const specs = useMemo(() => Object.entries(product?.specifications || {}).filter(([, value]) => value !== '' && value != null), [product])
  const images = product?.images?.length ? product.images : [product?.imageURL || DEFAULT_SERVICE_IMAGE]

  const addProduct = () => {
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
        <title>{product ? `${product.name} | DP Home Electric Products` : 'Product | DP Home Electric Services'}</title>
        <meta name="description" content={product?.shortDescription || 'Electrical product details from DP Home Electric Services.'} />
      </Helmet>

      <main className="bg-[#FAFAFA] py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#475569] hover:text-amber-700 dark:text-gray-300">
            <ArrowLeft size={17} /> Back to products
          </Link>

          {loading ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="aspect-square animate-pulse rounded-2xl bg-white dark:bg-white/10" />
              <div className="space-y-4">
                <div className="h-8 w-64 animate-pulse rounded-lg bg-white dark:bg-white/10" />
                <div className="h-24 animate-pulse rounded-lg bg-white dark:bg-white/10" />
                <div className="h-12 w-40 animate-pulse rounded-lg bg-white dark:bg-white/10" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-900">
              <PackageCheck className="mx-auto text-amber-600" size={36} />
              <h1 className="mt-4 text-2xl font-extrabold text-[#0F172A] dark:text-white">{error}</h1>
              <Link to="/products" className="btn-primary mt-5">Browse Products</Link>
            </div>
          ) : (
            <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <div className="flex gap-2 overflow-x-auto rounded-2xl pb-1 snap-x snap-mandatory no-scrollbar lg:hidden">
                  {images.map((image, index) => (
                    <img
                      key={`${image}-${index}-mobile`}
                      src={image}
                      alt={`${product.name} photo ${index + 1}`}
                      onError={handleImageFallback}
                      className="aspect-square w-full shrink-0 rounded-2xl object-cover snap-center"
                    />
                  ))}
                </div>
                <div className="hidden lg:block">
                  <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-900">
                    <img
                      src={selectedImage || images[0] || DEFAULT_SERVICE_IMAGE}
                      alt={product.name}
                      onError={handleImageFallback}
                      className="aspect-square w-full object-cover"
                      width="720"
                      height="720"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                      {images.map((image, index) => (
                        <button
                          type="button"
                          key={`${image}-${index}`}
                          onClick={() => setSelectedImage(image)}
                          className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${
                            selectedImage === image ? 'border-amber-500' : 'border-[#E2E8F0]'
                          }`}
                        >
                          <img src={image} alt={`${product.name} thumbnail ${index + 1}`} onError={handleImageFallback} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-900 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">{product.brand || 'Home Electric'}</p>
                <h1 className="mt-3 font-heading text-4xl font-extrabold text-[#0F172A] dark:text-white">{product.name}</h1>
                <p className="mt-4 text-base leading-7 text-[#475569] dark:text-gray-300">
                  {product.description || product.shortDescription || 'Reliable electrical product for home service needs.'}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-3xl font-black text-[#0F172A] dark:text-white">{currency(productPrice(product))}</span>
                  {product.mrp > productPrice(product) && <span className="text-sm font-semibold text-slate-400 line-through">{currency(product.mrp)}</span>}
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {product.stock > 0 ? 'In stock' : 'Availability on request'}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Service-ready', 'Pairs with booking', BadgeCheck],
                    [product.warranty || 'Warranty', 'Admin managed', ShieldCheck],
                    ['Rated quality', 'Verified catalog', Star],
                  ].map(([title, text, Icon]) => (
                    <div key={title} className="rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] p-4 dark:border-white/10 dark:bg-white/5">
                      <Icon className="text-amber-600" size={20} />
                      <p className="mt-3 text-sm font-bold text-[#0F172A] dark:text-white">{title}</p>
                      <p className="mt-1 text-xs text-[#475569] dark:text-gray-300">{text}</p>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn-primary mt-7 w-full sm:w-auto" onClick={addProduct}>
                  <ShoppingCart size={18} /> Add to Cart
                </button>

                {specs.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white">Specifications</h2>
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] dark:border-white/10">
                      {specs.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[0.45fr_0.55fr] border-b border-[#E2E8F0] text-sm last:border-b-0 dark:border-white/10">
                          <span className="bg-[#F8F9FA] px-4 py-3 font-semibold text-[#475569] dark:bg-white/5 dark:text-gray-300">{label}</span>
                          <span className="px-4 py-3 text-[#0F172A] dark:text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
