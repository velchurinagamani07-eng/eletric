import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

export const productPrice = (product) => Number(product?.salePrice || product?.price || 0)

export const normalizeProduct = (id, data = {}) => ({
  id,
  slug: data.slug || id,
  name: data.name || 'Untitled product',
  brand: data.brand || '',
  categoryId: data.categoryId || data.category || '',
  shortDescription: data.shortDescription || '',
  description: data.description || '',
  price: Number(data.price || 0),
  salePrice: data.salePrice ? Number(data.salePrice) : 0,
  mrp: Number(data.mrp || data.price || 0),
  stock: Number(data.stock || 0),
  warranty: data.warranty || '',
  images: Array.isArray(data.images) ? data.images : data.imageURL ? [data.imageURL] : [],
  imageURL: data.imageURL || data.images?.[0] || '',
  isActive: data.isActive !== false,
  isFeatured: Boolean(data.isFeatured),
  specifications: data.specifications || {},
  updatedAt: data.updatedAt,
  createdAt: data.createdAt,
})

export function useProducts({ onlyActive = true, categoryId = '' } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setProducts([])
        setLoading(false)
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const ref = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const next = snapshot.docs.map((entry) => normalizeProduct(entry.id, entry.data()))
        setProducts(next)
        setError('')
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to load products.')
        setProducts([])
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (onlyActive && !product.isActive) return false
        if (categoryId && product.categoryId !== categoryId) return false
        return true
      }),
    [categoryId, onlyActive, products],
  )

  return { products: filteredProducts, allProducts: products, loading, error, setProducts }
}

export function useProductCategories({ onlyActive = true } = {}) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => {
        setCategories([])
        setLoading(false)
      })
      return undefined
    }

    Promise.resolve().then(() => setLoading(true))
    const ref = query(collection(db, 'product_categories'), orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setCategories(snapshot.docs.map((entry) => ({ id: entry.id, slug: entry.data().slug || entry.id, ...entry.data() })))
        setError('')
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to load product categories.')
        setCategories([])
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return {
    categories: onlyActive ? categories.filter((item) => item.isActive !== false) : categories,
    loading,
    error,
    setCategories,
  }
}

export async function getProductBySlug(slug) {
  if (!db || !isFirebaseConfigured) return null

  const directSnap = await getDoc(doc(db, 'products', slug))
  if (directSnap.exists()) return normalizeProduct(directSnap.id, directSnap.data())

  const snap = await getDocs(query(collection(db, 'products'), where('slug', '==', slug), limit(1)))
  const entry = snap.docs[0]
  return entry ? normalizeProduct(entry.id, entry.data()) : null
}
