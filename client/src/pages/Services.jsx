import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import { useServiceCategories, useServices } from '../hooks/useServices'

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState(1200)
  const [sort, setSort] = useState('popularity')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const { services } = useServices({ onlyActive: true })
  const { categories } = useServiceCategories({ includeAll: true })
  const hasActiveFilters = category !== 'all' || Number(maxPrice) < 1200 || sort !== 'popularity'

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const results = services.filter((service) => {
      const categoryMatch =
        category === 'all' ||
        service.categorySlug === category ||
        service.category === category
      const priceMatch = service.basePrice <= Number(maxPrice)
      const queryMatch =
        !normalized ||
        service.name.toLowerCase().includes(normalized) ||
        service.description.toLowerCase().includes(normalized)
      return categoryMatch && priceMatch && queryMatch && service.isActive
    })

    return [...results].sort((a, b) => {
      if (sort === 'price-low') return a.basePrice - b.basePrice
      if (sort === 'newest') return String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id))
      return b.popularity - a.popularity
    })
  }, [category, maxPrice, query, services, sort])

  const selectCategory = (nextCategory) => {
    setCategory(nextCategory)
    setSearchParams(nextCategory === 'all' ? {} : { category: nextCategory })
  }

  return (
    <>
      <Helmet>
        <title>Electrical Services | DP Home Electric Services</title>
        <meta
          name="description"
          content="Browse fan installation, wiring, sockets, switch board repair, MCB, lighting, geyser, AC wiring, inverter and CCTV services."
        />
      </Helmet>

      <main className="bg-[var(--page-bg)] py-6 text-[var(--primary-text)] sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--primary-accent)]">Services & Categories</p>
              <h1 className="mt-2 text-3xl font-extrabold text-[var(--primary-text)]">Choose the right electrical service</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--secondary-text)]">
                Filter by category, price and popularity. Each service includes transparent starting pricing and warranty.
              </p>
            </div>
            <div className="relative hidden w-full lg:block lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="field pl-10"
                placeholder="Search services"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="sticky top-0 z-30 -mx-4 mt-5 grid gap-3 border-y border-[var(--card-border)] bg-[var(--page-bg)] px-4 py-3 shadow-sm lg:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="field pl-10"
                placeholder="Search services..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectCategory(item.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    category === item.id
                      ? 'bg-[var(--primary-accent)] text-white shadow-amber'
                      : 'border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--secondary-text)]'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between py-1">
              <p className="text-sm font-semibold text-[var(--secondary-text)]">{filteredServices.length} services found</p>
              <button
                type="button"
                onClick={() => setShowFilterSheet(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--primary-text)]"
              >
                <SlidersHorizontal size={14} /> Sort & Filter
                {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-accent)]" />}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="hidden h-fit rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm lg:block">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary-text)]">
                <Filter size={17} /> Filters
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Category</p>
                <div className="mt-3 grid gap-2">
                  {categories.map((item) => (
                    <button
                      key={item.slug || item.id}
                      type="button"
                      onClick={() => selectCategory(item.slug || item.id)}
                      className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                        category === (item.slug || item.id)
                          ? 'bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]'
                          : 'text-[var(--secondary-text)] hover:bg-[var(--page-bg)]'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-400">
                  <span>Max price</span>
                  <span>Rs. {maxPrice}</span>
                </label>
                <input
                  type="range"
                  min="149"
                  max="1200"
                  step="50"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="mt-3 w-full accent-amber-500"
                />
              </div>

              <div className="mt-6">
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                  <SlidersHorizontal size={15} /> Sort
                </label>
                <select className="field" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price low-high</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-4 hidden gap-3 lg:grid">
                <p className="text-sm font-semibold text-gray-500">{filteredServices.length} services found</p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-5 xl:grid-cols-3">
                {filteredServices.map((service) => (
                  <ServiceCard service={service} key={service.id} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <AnimatePresence>
          {showFilterSheet && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilterSheet(false)} />
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 pb-8 dark:bg-gray-900"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/15" />
                <h3 className="font-display text-lg font-bold text-navy dark:text-white">Sort & Filter</h3>

                <label className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-400">
                  <span>Max price</span>
                  <span>Rs. {maxPrice}</span>
                </label>
                <input
                  type="range"
                  min="149"
                  max="1200"
                  step="50"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="mt-3 w-full accent-amber-500"
                />

                <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-gray-400">Sort by</label>
                <select className="field mt-2" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price low-high</option>
                  <option value="newest">Newest</option>
                </select>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(1200)
                      setSort('popularity')
                      selectCategory('all')
                    }}
                    className="btn-secondary flex-1 justify-center"
                  >
                    Reset
                  </button>
                  <button type="button" onClick={() => setShowFilterSheet(false)} className="btn-primary flex-1 justify-center">
                    Show {filteredServices.length} results
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  )
}
