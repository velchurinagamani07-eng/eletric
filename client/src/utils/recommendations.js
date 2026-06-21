const historyKey = 'home-electric-service-history'

const readHistory = () => {
  try {
    return JSON.parse(window.localStorage.getItem(historyKey) || '[]')
  } catch {
    return []
  }
}

const writeHistory = (items) => {
  try {
    window.localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 12)))
  } catch {
    // Local storage may be unavailable in private browsing.
  }
}

const serviceId = (service) => String(service?.serviceId || service?.id || service?.slug || '')

export function recordServiceView(service) {
  const id = serviceId(service)
  if (!id) return
  const next = [
    {
      id,
      name: service.name,
      category: service.category || service.categorySlug || service.categoryId || '',
      viewedAt: new Date().toISOString(),
    },
    ...readHistory().filter((item) => item.id !== id),
  ]
  writeHistory(next)
}

export function getRecentServiceHistory() {
  return readHistory()
}

function rankPopular(service) {
  return Number(service.totalBookings || service.popularity || 0) + Number(service.rating || 0) * 10
}

export function getRecommendedServices({ currentService, services = [], cartItems = [], limit = 4 } = {}) {
  const currentId = serviceId(currentService)
  const cartIds = new Set(cartItems.map(serviceId).filter(Boolean))
  const seen = new Set([currentId, ...cartIds].filter(Boolean))
  const byId = new Map(services.map((service) => [serviceId(service), service]))
  const recommendations = []

  const add = (service) => {
    const id = serviceId(service)
    if (!id || seen.has(id)) return
    seen.add(id)
    recommendations.push(service)
  }

  ;(currentService?.relatedServiceIds || currentService?.frequentlyBookedWith || [])
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .forEach(add)

  const categorySeeds = [
    currentService?.category,
    currentService?.categorySlug,
    currentService?.categoryId,
    ...cartItems.map((item) => item.categorySlug || item.category || item.categoryId),
    ...readHistory().map((item) => item.category),
  ].filter(Boolean)

  const primaryCategory = categorySeeds[0]
  services
    .filter((service) => [service.category, service.categorySlug, service.categoryId].includes(primaryCategory))
    .sort((a, b) => rankPopular(b) - rankPopular(a))
    .forEach(add)

  if (recommendations.length < limit) {
    services
      .filter((service) => categorySeeds.includes(service.category || service.categorySlug || service.categoryId))
      .sort((a, b) => rankPopular(b) - rankPopular(a))
      .forEach(add)
  }

  if (recommendations.length < limit) {
    services
      .filter((service) => service.popular || service.isFeatured || Number(service.totalBookings || 0) > 0)
      .sort((a, b) => rankPopular(b) - rankPopular(a))
      .forEach(add)
  }

  if (recommendations.length < limit) {
    [...services].sort((a, b) => rankPopular(b) - rankPopular(a)).forEach(add)
  }

  return recommendations.slice(0, limit)
}
