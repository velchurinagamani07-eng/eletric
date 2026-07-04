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
import ProductCard from '../components/ProductCard'
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
    }, 4000)
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
    navigate(`/services?category=${encodeURIComponent(category.slug || category.id || category.name)}`)
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

      <main className="overflow-x-hidden bg-[var(--page-bg)] pb-6 text-[var(--primary-text)] lg:pb-0">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
          <aside className="hidden h-[calc(100vh-96px)] overflow-y-auto lg:sticky lg:top-20 lg:block">
            <div className="space-y-5 pr-2">
              <section>
                <h1 className="font-display text-2xl font-extrabold leading-tight text-[var(--heading-text)]">{settings.companyName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-gray-200">
                    <Star size={14} fill="currentColor" className="text-amber-400" />
                    <span className="font-semibold">4.80</span>
                    <span className="text-gray-400">(2.5K bookings)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-semibold text-green-400">
                    <Zap size={13} fill="currentColor" /> Instant
                  </span>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-sm text-gray-400">
                  <Clock size={13} /> In ~30 mins
                </p>
              </section>

              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-card">
                <h2 className="mb-3 text-sm font-bold text-[var(--primary-text)]">Select a service</h2>
                <CategoryGrid categories={validCategories} onOpen={openCategory} onMore={() => navigate('/services')} />
              </section>

              <CartSummary items={cartItems} total={cartTotal} count={cartCount} />
            </div>
          </aside>

          <section className="min-w-0 w-full">
            {/* Mobile Hero Header */}
            <section className="mb-4 px-4 lg:hidden">
              <h1 className="font-display text-2xl font-extrabold leading-tight text-[var(--heading-text)]">{settings.companyName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-gray-200">
                  <Star size={14} fill="currentColor" className="text-amber-400" />
                  <span className="font-semibold">4.80</span>
                  <span className="text-gray-400">(2.5K bookings)</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-semibold text-green-400">
                  <Zap size={13} fill="currentColor" /> Instant
                </span>
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Clock size={13} /> In ~30 mins
                </span>
              </div>
            </section>

            {/* Banner Slider */}
            <PromoSlider slides={slides} activeSlide={activeSlide} setActiveSlide={setActiveSlide} />

            {/* Construction & Moving Services Section */}
            <ConstructionMovingSection />

            {/* Select a Service (appears AFTER the banner on mobile) */}
            <section className="mt-6 px-4 lg:hidden">
              <h2 className="mb-4 text-lg font-bold text-[var(--heading-text)]">Select a service</h2>
              <CategoryGrid categories={validCategories} onOpen={openCategory} onMore={() => navigate('/services')} />
            </section>

            {/* Recommended for You */}
            <RecommendedServices
              currentService={browsingSeed}
              title={browsingSeed ? 'Recommended for You' : 'Most Popular Services'}
              subtitle={browsingSeed ? `Based on ${browsingSeed.name}` : 'Trusted services customers book most often.'}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 mt-6"
            />

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-[var(--primary-text)] sm:grid-cols-4 lg:hidden">
              {['1 Month Warranty', 'Same-Day Service', 'Verified Workers', 'Transparent Price'].map((label) => (
                <span key={label} className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 shadow-sm">
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
                      <h2 className="font-display text-xl font-extrabold text-[var(--primary-text)] sm:text-2xl">{category.name}</h2>
                      <p className="mt-1 text-sm text-[var(--secondary-text)]">Doorstep service by verified electricians</p>
                    </div>
                    <Link to={`/services?category=${category.slug || category.id}`} className="hidden items-center gap-1 text-sm font-bold text-primary sm:inline-flex">
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
                <section className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                  <h2 className="font-display text-lg font-extrabold text-[var(--primary-text)]">
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
                        className="shrink-0 rounded-2xl border border-[var(--card-border)] bg-[var(--page-bg)] px-4 py-3 text-left text-sm font-bold text-[var(--primary-text)] shadow-sm"
                      >
                        {product.name} <span className="text-[var(--primary-accent)]">{currency(productPrice(product))}</span>
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
  return (
    <div className="grid w-full grid-cols-3 gap-x-2 gap-y-4">
      {categories.map((category) => (
        <CategoryTile key={category.id} category={category} onClick={() => onOpen(category)} />
      ))}
    </div>
  )
}

function CategoryTile({ category, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-w-0 flex-col items-center gap-1.5 focus:outline-none">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm transition-all group-hover:border-[var(--primary-accent)]">
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
      <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-[var(--secondary-text)] group-hover:text-[var(--primary-accent)]">
        {category.name}
      </span>
    </button>
  )
}

function CategoryIcon({ category }) {
  const Icon = getCategoryIcon(category)
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--card-bg)] text-[var(--primary-accent)]">
      {createElement(Icon, { size: 26, strokeWidth: 2.3 })}
    </div>
  )
}

function PromoSlider({ slides, activeSlide, setActiveSlide }) {
  const slide = slides[activeSlide % slides.length] || fallbackSlides[0]
  const imageURL = slide.rightImageURL || slide.imageURL || ''

  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-lg md:min-h-[400px] md:h-[400px] flex flex-col md:flex-row">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || activeSlide}
          className="flex flex-col md:flex-row w-full h-full cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(event, info) => {
            const swipeThreshold = 50
            if (info.offset.x < -swipeThreshold) {
              setActiveSlide((index) => (index + 1) % slides.length)
            } else if (info.offset.x > swipeThreshold) {
              setActiveSlide((index) => (index - 1 + slides.length) % slides.length)
            }
          }}
        >
          {/* Content Area - Left on desktop, Bottom on mobile */}
          <div className="order-2 md:order-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center gap-3.5 bg-white text-[#1A1D23] w-full md:w-1/2 flex-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              ⚡ {slide.badge || 'Super Saver'}
            </span>

            <h2 className="font-display text-2xl font-black leading-tight text-gray-900 sm:text-3xl md:text-3xl lg:text-4xl">
              {slide.headline || 'Affordable repairs starting at just Rs. 149'}
            </h2>

            {slide.subtext && (
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-md">
                {slide.subtext}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-4">
              <Link
                to={slide.ctaLink || '/services'}
                className="inline-flex w-full md:w-fit justify-center items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
              >
                {slide.ctaText || 'Book Now'} <ArrowRight size={17} />
              </Link>

              {slides.length > 1 && (
                <div className="flex md:justify-start justify-center gap-1.5 mt-2">
                  {slides.map((item, index) => (
                    <button
                      key={item.id || index}
                      type="button"
                      aria-label={`Show slide ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === (activeSlide % slides.length) ? 'w-6 bg-red-600' : 'w-2 bg-zinc-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Image Area - Right on desktop, Top on mobile */}
          <div className="order-1 md:order-2 relative h-[200px] sm:h-[260px] md:h-full w-full md:w-1/2 overflow-hidden bg-zinc-100">
            {imageURL ? (
              <motion.img
                key={`${slide.id || activeSlide}-image`}
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
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full w-full object-cover"
              />
            ) : null}
            <div
              style={{ display: imageURL ? 'none' : 'flex' }}
              className="absolute inset-0 flex-col items-center justify-center gap-2 bg-zinc-200 text-center"
            >
              <ImageIcon className="text-gray-400" size={32} />
              <p className="max-w-[180px] text-xs font-semibold text-gray-500">Upload slider image from Admin Settings</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function UrbanServiceCard({ service, quantity, onAdd, onRemove }) {
  const hasDiscount = Number(service.salePrice || 0) > 0 && Number(service.salePrice) < Number(service.basePrice)
  const price = hasDiscount ? Number(service.salePrice) : Number(service.basePrice)
  return (
    <article className="w-[190px] shrink-0 overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] shadow-card sm:w-[230px]">
      <Link to={`/services/${service.slug || service.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[var(--card-bg)]">
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
          <span className="absolute left-3 top-3 rounded-full bg-[var(--primary-accent)] px-2 py-1 text-[10px] font-black text-white">
            Offer
          </span>
        )}
        <WishlistButton service={service} className="absolute right-2 top-2" />
      </Link>
      <div className="p-4">
        <h3 className="truncate text-sm font-bold text-[var(--primary-text)]">{service.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--secondary-text)]">
          <Star size={12} fill="currentColor" className="text-[var(--primary-accent)]" /> 4.8 <span>|</span> {service.duration}
        </p>
        <p className="mt-2 text-sm font-extrabold text-[var(--primary-accent)]">
          {currency(price)}
          {hasDiscount && <span className="ml-2 text-xs font-semibold text-[var(--secondary-text)] line-through">{currency(service.basePrice)}</span>}
        </p>
        <ul className="mt-2 space-y-1">
          {(service.includes || []).slice(0, 2).map((item) => (
            <li key={item} className="flex items-start gap-1 text-xs text-[var(--secondary-text)]">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={12} /> {item}
            </li>
          ))}
        </ul>
        {quantity > 0 ? (
          <div className="mt-4 grid grid-cols-[36px_1fr_36px] overflow-hidden rounded-lg border border-[var(--primary-accent)] bg-[var(--primary-accent)]/10 text-sm font-extrabold text-[var(--primary-text)]">
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



function CartSummary({ items, total }) {
  return (
    <section className="card p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-light text-primary">
          <ShoppingCart size={20} />
        </span>
        <div>
          <h2 className="font-display text-lg font-extrabold text-white">Cart</h2>
          <p className="text-xs font-semibold text-gray-500">{items.length ? `${items.length} selected item(s)` : 'No items in your cart'}</p>
        </div>
      </div>
      {items.length > 0 && (
        <>
          <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2 text-sm">
                <span className="line-clamp-1 font-semibold text-gray-200">{item.name}</span>
                <span className="font-bold text-primary">x{item.quantity || 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-4 text-sm">
            <span className="font-semibold text-gray-500">Total</span>
            <span className="font-display text-xl font-extrabold text-white">{currency(total)}</span>
          </div>
          <Link to="/cart" className="btn-primary mt-4 w-full">
            Proceed to checkout
          </Link>
        </>
      )}
    </section>
  )
}

function ConstructionMovingSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="mt-8 px-4 sm:px-0"
    >
      <div className="mb-4">
        <p className="eyebrow text-[var(--primary-accent)]">New Offerings</p>
        <h2 className="text-xl font-extrabold text-[var(--heading-text)] sm:text-2xl mt-1">Construction & Moving Services</h2>
        <p className="text-sm text-[var(--secondary-text)] mt-1">Upcoming premium verticals. Book preview or enquire interest below.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Card 1 */}
        <motion.div
          variants={cardVariants}
          whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(220, 38, 38, 0.15)" }}
          className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition-all duration-300 relative group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl group-hover:bg-red-600/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20 animate-pulse">
                🚀 Launching Soon
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-extrabold text-[var(--heading-text)]">Construction Services</h3>
            <p className="mt-2 text-xs text-[var(--secondary-text)]">Professional renovation, painting, brickwork, and civil contracts.</p>
            
            <ul className="mt-4 space-y-2">
              {[
                "Verified expert contractors",
                "Premium materials & pricing transparency",
                "Dedicated project manager supervision"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-xs text-[var(--primary-text)]">
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://wa.me/919398724704?text=Hi! I am interested in your Construction/Renovation services."
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-6 w-full text-center py-2.5 font-bold hover:bg-[var(--primary-accent)] hover:text-white transition duration-200"
          >
            Enquire via WhatsApp
          </a>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          variants={cardVariants}
          whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(220, 38, 38, 0.15)" }}
          className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition-all duration-300 relative group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl group-hover:bg-red-600/10 transition-colors" />
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20 animate-pulse">
                ✨ Premium Quality
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-extrabold text-[var(--heading-text)]">Moving & Packing Services</h3>
            <p className="mt-2 text-xs text-[var(--secondary-text)]">Secure home shifting, commercial moving, and packaging solutions.</p>
            
            <ul className="mt-4 space-y-2">
              {[
                "Full transit damage insurance protection",
                "On-time packaging and delivery guarantee",
                "Expert packers with heavy loading gear"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-xs text-[var(--primary-text)]">
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://wa.me/919398724704?text=Hi! I am interested in your Moving & Packing services."
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-6 w-full text-center py-2.5 font-bold hover:bg-[var(--primary-accent)] hover:text-white transition duration-200"
          >
            Enquire via WhatsApp
          </a>
        </motion.div>
      </div>
    </motion.section>
  )
}
