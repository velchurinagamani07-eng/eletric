import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { doc, onSnapshot } from 'firebase/firestore'
import { ArrowRight, CheckCircle2, Clock, Minus, Plus, ShoppingCart, Star, Zap } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { settings } from '../data/catalog'
import { useServiceCategories, useServices } from '../hooks/useServices'
import { productPrice, useProducts } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { getDefaultImage, getServiceImage, handleImageFallback } from '../utils/defaultImages'

const fallbackSlides = [
  {
    id: 'starter',
    badge: 'Super Saver',
    badgeColor: 'green',
    headline: 'Affordable repairs starting at just Rs. 149',
    imageURL: '/default-images/services/electric.png',
    bgColor: '#FEF3C7',
    ctaText: 'Book Now',
    ctaLink: '/services',
    isActive: true,
    order: 0,
  },
  {
    id: 'warranty',
    badge: '3 Month Warranty',
    badgeColor: 'amber',
    headline: 'Verified electricians for every home visit',
    imageURL: '/default-images/services/wiring.png',
    bgColor: '#EFF6FF',
    ctaText: 'View Services',
    ctaLink: '/services',
    isActive: true,
    order: 1,
  },
]

const badgeTone = {
  green: 'bg-green-600 text-white',
  amber: 'bg-primary text-white',
  blue: 'bg-blue-600 text-white',
}

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
  const recommendedProducts = products.slice(0, 3)

  const scrollToCategory = (categoryId) => {
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

      <main className="bg-surface pb-6 lg:pb-0">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr] lg:py-8">
          <aside className="hidden h-[calc(100vh-96px)] overflow-y-auto lg:sticky lg:top-20 lg:block">
            <div className="space-y-5 pr-2">
              <section>
                <h1 className="font-display text-3xl font-extrabold text-navy">{settings.companyName}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star size={16} fill="currentColor" className="text-primary" /> 4.80 (2.5K bookings)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Zap size={16} className="text-primary" /> Instant
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={16} className="text-primary" /> In ~30 mins
                  </span>
                </div>
              </section>

              <section className="card p-4">
                <h2 className="font-display text-lg font-extrabold text-navy">Select a service</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {categories.slice(0, 10).map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className="rounded-2xl border border-surface-border bg-white p-3 text-left shadow-sm transition hover:border-primary hover:bg-primary-light"
                    >
                      <img
                        src={category.imageURL || category.iconURL || getDefaultImage(category.id)}
                        alt=""
                        width="72"
                        height="72"
                        loading="lazy"
                        decoding="async"
                        onError={(event) => handleImageFallback(event, getDefaultImage(category.id))}
                        className="h-16 w-full rounded-xl object-cover"
                      />
                      <p className="mt-2 line-clamp-2 text-sm font-bold text-navy">{category.name}</p>
                    </button>
                  ))}
                </div>
              </section>

              <CartSummary items={cartItems} total={cartTotal} />
            </div>
          </aside>

          <section className="min-w-0">
            <PromoSlider slides={slides} activeSlide={activeSlide} setActiveSlide={setActiveSlide} />

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-navy sm:grid-cols-4 lg:hidden">
              {['3 Month Warranty', 'Same-Day Service', 'Verified Workers', 'Transparent Price'].map((label) => (
                <span key={label} className="rounded-2xl border border-surface-border bg-white px-3 py-2 shadow-sm">
                  {label}
                </span>
              ))}
            </div>

            <section className="mt-5 grid grid-cols-4 gap-3 lg:hidden">
              {categories.slice(0, 12).map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => scrollToCategory(category.id)}
                  className="rounded-2xl border border-surface-border bg-white p-2 text-center shadow-sm"
                >
                  <img
                    src={category.imageURL || category.iconURL || getDefaultImage(category.id)}
                    alt=""
                    width="64"
                    height="64"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => handleImageFallback(event, getDefaultImage(category.id))}
                    className="mx-auto h-12 w-12 rounded-xl object-cover"
                  />
                  <p className="mt-1 line-clamp-2 text-[11px] font-bold text-navy">{category.name}</p>
                </button>
              ))}
            </section>

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

function PromoSlider({ slides, activeSlide, setActiveSlide }) {
  const slide = slides[activeSlide % slides.length] || fallbackSlides[0]
  return (
    <section className="relative overflow-hidden rounded-3xl border border-surface-border bg-white shadow-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || activeSlide}
          className="grid min-h-[260px] lg:grid-cols-[0.92fr_1.08fr]"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-col justify-center p-6 sm:p-8" style={{ backgroundColor: slide.bgColor || '#FEF3C7' }}>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${badgeTone[slide.badgeColor] || badgeTone.amber}`}>
              {slide.badge || 'Super Saver'}
            </span>
            <h2 className="mt-4 max-w-md font-display text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              {slide.headline || 'Affordable repairs starting at just Rs. 149'}
            </h2>
            <Link to={slide.ctaLink || '/services'} className="btn-primary mt-6 w-fit">
              {slide.ctaText || 'Book Now'} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="min-h-[220px] bg-gray-100">
            <img
              src={slide.imageURL || fallbackSlides[0].imageURL}
              alt={slide.headline || 'Electrical service'}
              width="720"
              height="420"
              loading={activeSlide === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onError={(event) => handleImageFallback(event)}
              className="h-full w-full object-cover"
            />
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
    <article className="w-[230px] shrink-0 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
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
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2 py-1 text-[10px] font-black text-white">
            Offer
          </span>
        )}
      </Link>
      <div className="p-4">
        <h3 className="truncate text-sm font-bold text-navy">{service.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-500">
          <Star size={12} fill="currentColor" className="text-primary" /> 4.8 <span>|</span> {service.duration}
        </p>
        <p className="mt-2 text-sm font-extrabold text-navy">
          {currency(price)}
          {hasDiscount && <span className="ml-2 text-xs font-semibold text-gray-400 line-through">{currency(service.basePrice)}</span>}
        </p>
        <ul className="mt-2 space-y-1">
          {(service.includes || []).slice(0, 2).map((item) => (
            <li key={item} className="flex items-start gap-1 text-xs text-gray-500">
              <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={12} /> {item}
            </li>
          ))}
        </ul>
        {quantity > 0 ? (
          <div className="mt-4 grid grid-cols-[36px_1fr_36px] overflow-hidden rounded-2xl border border-primary bg-primary-light text-sm font-extrabold text-navy">
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
