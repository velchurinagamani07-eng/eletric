import { useMemo } from 'react'
import { categories as categorySeed, services as serviceSeed } from '../data/catalog'
import { useFirestoreCollection } from './useFirestoreCollection'

function stableSlug(value = 'service') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'service'
}

function looksLikeWorkerRecord(category = {}) {
  const name = String(category.name || '').trim().toLowerCase()
  return (
    name === 'mahi' ||
    'specialization' in category ||
    'phone' in category ||
    'mobile' in category ||
    'photoURL' in category ||
    ('rating' in category && 'totalJobsCompleted' in category)
  )
}

function normalizeCategory(category = {}) {
  const id = category.id || category.slug || stableSlug(category.name || 'category')
  const slug = category.slug || (id === 'all' ? 'all' : stableSlug(category.name || id))

  return {
    ...category,
    id,
    slug,
    name: category.name || 'Untitled category',
    isActive: category.isActive !== false,
  }
}

export function normalizeService(service = {}) {
  const id = service.id || service.slug || stableSlug(service.name)
  const basePrice = Number(service.basePrice || service.price || 0)
  const description = service.description || service.shortDescription || ''
  const images = Array.isArray(service.images) ? service.images : service.imageURL ? [service.imageURL] : []

  return {
    ...service,
    id,
    slug: service.slug || id,
    category: service.category || service.categoryId || 'general',
    name: service.name || 'Untitled service',
    description,
    shortDescription: service.shortDescription || description.slice(0, 120),
    basePrice,
    duration: service.duration || '45-60 min',
    imageURL: service.imageURL || images[0] || '',
    images,
    includes: Array.isArray(service.includes) && service.includes.length
      ? service.includes
      : ['Fault diagnosis', 'Safe workmanship', 'Post-service testing'],
    labor: Number(service.labor || basePrice || 0),
    partsEstimate: Number(service.partsEstimate || 0),
    popularity: Number(service.popularity || 0),
    isActive: service.isActive !== false,
  }
}

export function useServices({ onlyActive = true, category = '' } = {}) {
  const { items, setItems, loading, error } = useFirestoreCollection('services', serviceSeed, 'createdAt')

  const allServices = useMemo(
    () => items.map(normalizeService),
    [items],
  )

  const visibleServices = useMemo(
    () =>
      allServices.filter((service) => {
        if (onlyActive && !service.isActive) return false
        if (category && category !== 'all' && service.category !== category) return false
        return true
      }),
    [allServices, category, onlyActive],
  )

  return { services: visibleServices, allServices, setItems, loading, error }
}

export function useServiceCategories({ includeAll = false, onlyActive = true } = {}) {
  const { items, loading, error } = useFirestoreCollection('categories', categorySeed, 'order')

  const categories = useMemo(() => {
    const filtered = items.filter((category) => {
      if (!includeAll && category.id === 'all') return false
      if (looksLikeWorkerRecord(category)) return false
      if (!category.slug && category.id !== 'all') return false
      if (!category.name || category.name === 'Untitled category') return false
      if (onlyActive && category.isActive === false) return false
      return true
    }).map(normalizeCategory)
    const hasAll = filtered.some((category) => category.id === 'all')
    return includeAll && !hasAll ? [normalizeCategory(categorySeed[0]), ...filtered] : filtered
  }, [includeAll, items, onlyActive])

  return { categories, loading, error }
}
