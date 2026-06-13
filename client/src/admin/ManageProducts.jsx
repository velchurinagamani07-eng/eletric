import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Edit3, Loader2, PackagePlus, Save, Trash2 } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import { db, isFirebaseConfigured } from '../firebase/config'
import { normalizeProduct, productPrice, useProductCategories, useProducts } from '../hooks/useProducts'
import { currency } from '../utils/format'
import { DEFAULT_SERVICE_IMAGE, handleImageFallback } from '../utils/defaultImages'
import { slugify } from '../utils/firebaseUploads'

const emptyForm = {
  id: '',
  name: '',
  brand: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  price: '',
  salePrice: '',
  mrp: '',
  stock: '',
  warranty: '',
  images: [],
  isActive: true,
  isFeatured: false,
  specificationsText: '',
}

const parseSpecs = (value) =>
  Object.fromEntries(
    String(value || '')
      .split('\n')
      .map((line) => line.split(':').map((part) => part.trim()))
      .filter(([key, specValue]) => key && specValue),
  )

const specsToText = (specs = {}) => Object.entries(specs).map(([key, value]) => `${key}: ${value}`).join('\n')

export default function ManageProducts() {
  const { allProducts, setProducts, loading, error } = useProducts({ onlyActive: false })
  const { categories } = useProductCategories({ onlyActive: false })
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const editProduct = (product) => {
    setForm({
      ...emptyForm,
      ...product,
      price: product.price || '',
      salePrice: product.salePrice || '',
      mrp: product.mrp || '',
      stock: product.stock || '',
      images: product.images || (product.imageURL ? [product.imageURL] : []),
      specificationsText: specsToText(product.specifications),
    })
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Product name is required.')
      return
    }
    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return
    }

    setSaving(true)
    try {
      const id = form.id || slugify(form.name) || `product-${Date.now()}`
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.name) || id,
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        price: Number(form.price || 0),
        salePrice: Number(form.salePrice || 0),
        mrp: Number(form.mrp || form.price || 0),
        stock: Number(form.stock || 0),
        warranty: form.warranty.trim(),
        images: form.images,
        imageURL: form.images[0] || '',
        isActive: Boolean(form.isActive),
        isFeatured: Boolean(form.isFeatured),
        specifications: parseSpecs(form.specificationsText),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, 'products', id), { ...payload, createdAt: serverTimestamp() }, { merge: true })
      const nextProduct = normalizeProduct(id, payload)
      setProducts((items) => [nextProduct, ...items.filter((item) => item.id !== id)])
      setForm(emptyForm)
      toast.success('Product saved.')
    } catch (err) {
      toast.error(err.message || 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete '${product.name}'?`)) return
    try {
      if (db && isFirebaseConfigured) await deleteDoc(doc(db, 'products', product.id))
      setProducts((items) => items.filter((item) => item.id !== product.id))
      toast.success('Product deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete product.')
    }
  }

  return (
    <section className="grid gap-5">
      <form onSubmit={saveProduct} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy-900 dark:text-white">Product Catalog</h2>
            <p className="mt-1 text-sm text-gray-500">Create electrical products with compressed images and Firestore stock data.</p>
          </div>
          {form.id && (
            <button type="button" className="btn-secondary" onClick={() => setForm(emptyForm)}>
              New Product
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Product name</span>
            <input className="field" value={form.name} onChange={(event) => update('name', event.target.value)} required />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Brand</span>
            <input className="field" value={form.brand} onChange={(event) => update('brand', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Category</span>
            <select className="field" value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Warranty</span>
            <input className="field" value={form.warranty} onChange={(event) => update('warranty', event.target.value)} placeholder="1 year replacement" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Price</span>
            <input className="field" type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Sale price</span>
            <input className="field" type="number" min="0" value={form.salePrice} onChange={(event) => update('salePrice', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">MRP</span>
            <input className="field" type="number" min="0" value={form.mrp} onChange={(event) => update('mrp', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Stock</span>
            <input className="field" type="number" min="0" value={form.stock} onChange={(event) => update('stock', event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Short description</span>
            <input className="field" value={form.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Description</span>
            <textarea className="field min-h-24" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Specifications</span>
            <textarea className="field min-h-24" value={form.specificationsText} onChange={(event) => update('specificationsText', event.target.value)} placeholder="Voltage: 240V&#10;Material: Copper" />
          </label>
          <div className="flex flex-wrap gap-5 md:col-span-2">
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} />
              Active
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)} />
              Featured
            </label>
          </div>
        </div>

        <div className="mt-5">
          <ImageUploader
            label="Upload product images"
            multiple
            useAdminStorage
            maxFiles={6}
            currentImageUrl={form.images}
            folder={`products-${form.name || 'new'}`}
            onUploadComplete={(urls) => update('images', urls)}
          />
        </div>

        <button type="submit" className="btn-primary mt-5" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={17} /> : form.id ? <Save size={17} /> : <PackagePlus size={17} />}
          {form.id ? 'Save Product' : 'Add Product'}
        </button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <h3 className="font-bold text-navy-900 dark:text-white">Products</h3>
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-4 grid gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <div key={`product-admin-skeleton-${index}`} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />)
          ) : allProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm font-semibold text-gray-500 dark:border-white/10">
              No products yet.
            </p>
          ) : (
            allProducts.map((product) => (
              <article key={product.id} className="grid gap-4 rounded-xl border border-gray-100 p-4 dark:border-white/10 md:grid-cols-[96px_1fr_auto]">
                <img src={product.imageURL || DEFAULT_SERVICE_IMAGE} alt="" onError={handleImageFallback} className="h-24 w-full rounded-lg object-cover md:w-24" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-gray-950 dark:text-white">{product.name}</h4>
                    <span className={`badge ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                    {product.isFeatured && <span className="badge bg-amber-100 text-amber-800">Featured</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{product.brand || 'No brand'} | {categoryName[product.categoryId] || 'No category'}</p>
                  <p className="mt-1 text-sm font-black text-amber-700">{currency(productPrice(product))} | Stock {product.stock}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => editProduct(product)} aria-label="Edit product">
                    <Edit3 size={16} />
                  </button>
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50" onClick={() => removeProduct(product)} aria-label="Delete product">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
