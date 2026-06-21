import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { doc, onSnapshot } from 'firebase/firestore'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ImageIcon,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Zap,
} from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { settings } from '../data/catalog'
import { useServiceCategories, useServices } from '../hooks/useServices'
import { productPrice, useProducts } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { getDefaultImage, getServiceImage, handleImageFallback } from '../utils/defaultImages'
import { getCategoryIcon } from '../utils/categoryIcons'
import WishlistButton from '../components/WishlistButton'
import RecommendedServices from '../components/RecommendedServices'
import { getRecentServiceHistory } from '../utils/recommendations'

const fallbackSlides = [
  {
    id: 'starter',
    badge: 'Super Saver',
    badgeColor: '#16A34A',
    headline: 'Affordable repairs starting at just Rs. 149',
    rightImageURL: '/default-images/services/electric.png',
    bgColor: '#FEF3C7',
    ctaText: 'Book Now',
    ctaLink: '/services',
    isActive: true,
    order: 0,
  },
  {
    id: 'warranty',
    badge: '1 Month Warranty',
    badgeColor: '#F59E0B',
    headline: 'Verified electricians for every home visit',
    rightImageURL: '/default-images/services/wiring.png',
    bgColor: '#EFF6FF',
    ctaText: 'View Services',
    ctaLink: '/services',
    isActive: true,
    order: 1,
  },
]

export default function Home() {
  const [slides, setSlides] = useState(fallbackSlides)
  const [activeSlide, setActiveSlide] = useState(0)
  const categoryRefs = useRef({})
  const { services } = useServices({ onlyActive: true })
  const { categories } = useServiceCategories({ includeAll: false })
  const { products } = useProducts({ onlyActive: true })
  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const decrementItem = useCartStore((state) => state.decrementItem)
  const navigate = useNavigate()

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'promoSlides'),
      (snapshot) => {
        if (!snapshot.exists()) return
        const data = snapshot.data()
        const liveSlides = (data.promoSlides || data.slides || [])
          .filter((slide) => slide.isActive !== false)
          .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        if (liveSlides.length) setSlides(liveSlides)
      },
      () => {},
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveSlide((index) => (index + 1) % slides.length)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const servicesByCategory = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        services: services.filter((service) => service.category === category.id),
      })).filter((category) => category.services.length),
    [categories, services],
  )

  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.basePrice || item.price || 0) * Number(item.quantity || 1), 0)
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  const recommendedProducts = products.slice(0, 3)
  const browsingSeed = useMemo(() => {
    const recent = getRecentServiceHistory()[0]
    return services.find((service) => service.id === recent?.id || service.slug === recent?.id) || null
  }, [services])
  const validCategories = useMemo(
    () => categories.filter((category) => category.slug && !('specialization' in category) && !('photoURL' in category)),
    [categories],
  )

  const openCategory = (category) => {
    navigate(`/services?category=${encodeURIComponent(category.id || category.slug || category.name)}`)
  }

  return (
    <>
      <Helmet>
        <title>DP Home Electric Services - Expert Electricians in Tuni</title>
        <meta
          name="description"
          content="Book verified electricians in Tuni for fan installation, wiring, switches, MCB, lighting, CCTV, AC wiring and repairs with transparent pricing."
        />
        <meta
          name="keywords"
          content="electrician Tuni, DP Home Electric Services, fan installation Tuni, house wiring, electrical repair"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: settings.companyName,
            telephone: `+91${settings.phone}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Tuni',
              addressRegion: 'Andhra Pradesh',
              addressCountry: 'IN',
            },
            description: 'Expert home electrical services',
            areaServed: 'Tuni',
          })}
        </script>
      </Helmet>

      <main className="overflow-x-hidden bg-[#0A0A0A] pb-6 text-white lg:pb-0">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
          <aside className="hidden h-[calc(100vh-96px)] overflow-y-auto lg:sticky lg:top-20 lg:block">
            <div className="space-y-5 pr-2">
              <section>
                <h1 className="font-display text-2xl font-extrabold leading-tight text-navy">{settings.companyName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star size={14} fill="currentColor" className="text-amber-400" />
                    <span className="font-semibold">4.80</span>
                    <span className="text-gray-400">(2.5K bookings)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <Zap size={13} fill="currentColor" /> Instant
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <Clock size={13} /> In ~30 mins
                </p>
              </section>

              <section className="rounded-2xl border border-surface-border bg-white p-4 shadow-card">
                <h2 className="mb-3 text-sm font-bold text-navy">Select a service</h2>
                <CategoryGrid categories={validCategories} onOpen={openCategory} onMore={() => navigate('/services')} />
              </section>

              <CartSummary items={cartItems} total={cartTotal} count={cartCount} />
            </div>
          </aside>

          <section className="min-w-0 w-full">
            <section className="mb-4 lg:hidden">
              <h1 className="font-display text-2xl font-extrabold leading-tight text-navy">{settings.companyName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} fill="currentColor" className="text-amber-400" />
                  <span className="font-semibold">4.80</span>
                  <span className="text-gray-400">(2.5K bookings)</span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Zap size={13} fill="currentColor" /> Instant
                </span>
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Clock size={13} /> In ~30 mins
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-surface-border bg-white p-4 shadow-card">
                <h2 className="mb-3 text-sm font-bold text-navy">Select a service</h2>
                <CategoryGrid categories={validCategories} onOpen={openCategory} onMore={() => navigate('/services')} />
              </div>
            </section>

            <PromoSlider slides={slides} activeSlide={activeSlide} setActiveSlide={setActiveSlide} />

            <RecommendedServices
              currentService={browsingSeed}
              title={browsingSeed ? 'Recommended for You' : 'Most Popular Services'}
              subtitle={browsingSeed ? `Based on ${browsingSeed.name}` : 'Trusted services customers book most often.'}
              className="rounded-lg border border-zinc-800 bg-black/20 p-4"
            />

            <div className="mt-4 lg:hidden">
              <CartSummary items={cartItems} total={cartTotal} count={cartCount} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-white sm:grid-cols-4 lg:hidden">
              {['1 Month Warranty', 'Same-Day Service', 'Verified Workers', 'Transparent Price'].map((label) => (
                <span key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 shadow-sm">
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-7">
              {servicesByCategory.map((category) => (
                <section
                  key={category.id}
                  ref={(node) => {
                    categoryRefs.current[category.id] = node
                  }}
                  className="scroll-mt-24"
                >
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-extrabold text-navy">{category.name}</h2>
                      <p className="mt-1 text-sm text-gray-500">Doorstep service by verified electricians</p>
                    </div>
                    <Link to={`/services?category=${category.id}`} className="hidden items-center gap-1 text-sm font-bold text-primary sm:inline-flex">
                      See all <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {category.services.map((service) => (
                      <UrbanServiceCard
                        key={service.id}
                        service={service}
                        quantity={cartItems.find((item) => item.id === service.id)?.quantity || 0}
                        onAdd={() => addItem(service)}
                        onRemove={() => decrementItem(service.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {recommendedProducts.length > 0 && (
                <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                  <h2 className="font-display text-lg font-extrabold text-navy">
                    Based on Fan Installation, customers also buy:
                  </h2>
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                    {recommendedProducts.map((product) => (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => addItem({
                          ...product,
                          itemType: 'product',
                          basePrice: productPrice(product),
                          shortDescription: product.shortDescription || product.brand,
                        })}
                        className="shrink-0 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-left text-sm font-bold text-navy shadow-sm"
                      >
                        {product.name} <span className="text-primary">{currency(productPrice(product))}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {products.length > 0 && (
                <section>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="eyebrow">Products</p>
                      <h2 className="section-title mt-2">Our Products</h2>
                    </div>
                    <Link to="/products" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                      See all <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {products.slice(0, 10).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={() => addItem({
                          ...product,
                          itemType: 'product',
                          basePrice: productPrice(product),
                          shortDescription: product.shortDescription || product.brand,
                        })}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function CategoryGrid({ categories, onOpen, onMore }) {
  const displayCategories = categories.length > 9 ? categories.slice(0, 8) : categories.slice(0, 9)
  const moreCount = categories.length > 9 ? categories.length - 8 : 0

  return (
    <div className="grid w-full grid-cols-3 gap-x-2 gap-y-4">
      {displayCategories.map((category) => (
        <CategoryTile key={category.id} category={category} onClick={() => onOpen(category)} />
      ))}
      {moreCount > 0 && (
        <button type="button" onClick={onMore} className="group flex flex-col items-center gap-1.5 focus:outline-none">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-amber-300 bg-amber-50 text-sm font-bold text-amber-600 transition-all group-hover:border-amber-400 group-hover:bg-amber-100">
            +{moreCount}
          </div>
          <span className="text-center text-[11px] font-medium text-gray-700 group-hover:text-amber-600">More</span>
        </button>
      )}
    </div>
  )
}

function CategoryTile({ category, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-w-0 flex-col items-center gap-1.5 focus:outline-none">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-surface-border bg-amber-50 shadow-sm transition-all group-hover:border-amber-400">
        {category.imageURL || category.iconURL ? (
          <img
            src={category.imageURL || category.iconURL}
            alt={category.name}
            width="64"
            height="64"
            loading="lazy"
            decoding="async"
            onError={(event) => handleImageFallback(event, getDefaultImage(category.id))}
            className="h-full w-full object-cover"
          />
        ) : (
          <CategoryIcon category={category} />
        )}
      </div>
      <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-gray-700 group-hover:text-amber-600">
        {category.name}
      </span>
    </button>
  )
}

function CategoryIcon({ category }) {
  const Icon = getCategoryIcon(category)
  return (
    <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-600">
      {createElement(Icon, { size: 26, strokeWidth: 2.3 })}
    </div>
  )
}

function PromoSlider({ slides, activeSlide, setActiveSlide }) {
  const slide = slides[activeSlide % slides.length] || fallbackSlides[0]
  const buttonColor = /^#/.test(String(slide.badgeColor || '')) ? slide.badgeColor : '#F59E0B'
  const badgeColor = /^#/.test(String(slide.badgeColor || '')) ? slide.badgeColor : '#16A34A'
  const imageURL = slide.rightImageURL || slide.imageURL || ''

  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || activeSlide}
          className="grid min-h-[280px] grid-cols-1 md:grid-cols-2"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
          style={{ backgroundColor: slide.bgColor || '#FEF3C7' }}
        >
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            {slide.badge && (
              <span
                className="mb-4 inline-flex w-fit rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {slide.badge}
              </span>
            )}
            <h2 className="max-w-md font-display text-3xl font-extrabold leading-tight text-[#1A1D23] sm:text-4xl">
              {slide.headline || 'Affordable repairs starting at just Rs. 149'}
            </h2>
            {slide.ctaText && (
              <Link
                to={slide.ctaLink || '/services'}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: buttonColor }}
              >
                {slide.ctaText} <ArrowRight size={17} />
              </Link>
            )}
          </div>
          <div className="relative min-h-[220px] min-w-0 overflow-hidden">
            {imageURL ? (
              <img
                src={imageURL}
                alt={slide.headline || 'Electrical service'}
                width="720"
                height="420"
                loading={activeSlide === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                  event.currentTarget.nextSibling.style.display = 'flex'
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              style={{ display: imageURL ? 'none' : 'flex' }}
              className="absolute inset-0 flex-col items-center justify-center gap-2 bg-white/35 text-center backdrop-blur-sm"
            >
              <ImageIcon className="text-gray-300" size={32} />
              <p className="max-w-[180px] text-xs font-semibold text-gray-400">Upload right-side image from Admin Settings</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((item, index) => (
            <button
              key={item.id || index}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-primary' : 'w-2 bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function UrbanServiceCard({ service, quantity, onAdd, onRemove }) {
  const hasDiscount = Number(service.salePrice || 0) > 0 && Number(service.salePrice) < Number(service.basePrice)
  const price = hasDiscount ? Number(service.salePrice) : Number(service.basePrice)
  return (
    <article className="w-[190px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-card sm:w-[230px]">
      <Link to={`/services/${service.slug || service.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={getServiceImage(service)}
          alt={service.name}
          width="230"
          height="173"
          loading="lazy"
          decoding="async"
          onError={(event) => handleImageFallback(event, getDefaultImage(service.category))}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-white">
            Offer
          </span>
        )}
        <WishlistButton service={service} className="absolute right-2 top-2" />
      </Link>
      <div className="p-4">
        <h3 className="truncate text-sm font-bold text-white">{service.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-500">
          <Star size={12} fill="currentColor" className="text-red-500" /> 4.8 <span>|</span> {service.duration}
        </p>
        <p className="mt-2 text-sm font-extrabold text-red-400">
          {currency(price)}
          {hasDiscount && <span className="ml-2 text-xs font-semibold text-gray-400 line-through">{currency(service.basePrice)}</span>}
        </p>
        <ul className="mt-2 space-y-1">
          {(service.includes || []).slice(0, 2).map((item) => (
            <li key={item} className="flex items-start gap-1 text-xs text-gray-500">
              <CheckCircle2 className="mt-0.5 shrink-0 text-green-500" size={12} /> {item}
            </li>
          ))}
        </ul>
        {quantity > 0 ? (
          <div className="mt-4 grid grid-cols-[36px_1fr_36px] overflow-hidden rounded-lg border border-red-700 bg-red-600/10 text-sm font-extrabold text-white">
            <button type="button" onClick={onRemove} className="grid h-10 place-items-center" aria-label={`Remove ${service.name}`}>
              <Minus size={15} />
            </button>
            <span className="grid place-items-center">{quantity}</span>
            <button type="button" onClick={onAdd} className="grid h-10 place-items-center" aria-label={`Add ${service.name}`}>
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button type="button" className="btn-secondary mt-4 h-10 w-full px-4 py-2" onClick={onAdd}>
            Add
          </button>
        )}
      </div>
    </article>
  )
}

function ProductCard({ product, onAdd }) {
  const price = productPrice(product)
  return (
    <article className="w-[210px] shrink-0 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
      <Link to={`/products/${product.slug || product.id}`} className="block aspect-square bg-gray-100">
        <img
          src={product.imageURL || product.images?.[0] || '/default-images/services/electric.png'}
          alt={product.name}
          width="210"
          height="210"
          loading="lazy"
          decoding="async"
          onError={(event) => handleImageFallback(event)}
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-navy">{product.name}</h3>
        <p className="mt-1 text-xs text-gray-500">{product.brand || product.warranty || 'Electrical product'}</p>
        <p className="mt-2 font-display text-lg font-extrabold text-navy">{currency(price)}</p>
        <button type="button" className="btn-secondary mt-3 h-10 w-full px-4 py-2" onClick={onAdd}>
          Add
        </button>
      </div>
    </article>
  )
}

function CartSummary({ items, total }) {
  return (
    <section className="card p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-light text-primary">
          <ShoppingCart size={20} />
        </span>
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy">Cart</h2>
          <p className="text-xs font-semibold text-gray-500">{items.length ? `${items.length} selected item(s)` : 'No items in your cart'}</p>
        </div>
      </div>
      {items.length > 0 && (
        <>
          <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2 text-sm">
                <span className="line-clamp-1 font-semibold text-navy">{item.name}</span>
                <span className="font-bold text-primary">x{item.quantity || 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-4 text-sm">
            <span className="font-semibold text-gray-500">Total</span>
            <span className="font-display text-xl font-extrabold text-navy">{currency(total)}</span>
          </div>
          <Link to="/cart" className="btn-primary mt-4 w-full">
            Proceed to checkout
          </Link>
        </>
      )}
    </section>
  )
}
