import { useState } from 'react'
import toast from 'react-hot-toast'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Edit3, Layers3, Loader2, Save, Trash2 } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useProductCategories } from '../hooks/useProducts'
import { slugify } from '../utils/firebaseUploads'

const emptyForm = {
  id: '',
  name: '',
  description: '',
  imageURL: '',
  order: 1,
  isActive: true,
}

export default function ManageProductCategories() {
  const { categories, setCategories, loading, error } = useProductCategories({ onlyActive: false })
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const saveCategory = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Category name is required.')
      return
    }
    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return
    }

    setSaving(true)
    try {
      const id = form.id || slugify(form.name) || `product-category-${Date.now()}`
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.name) || id,
        description: form.description.trim(),
        imageURL: form.imageURL,
        order: Number(form.order || categories.length + 1),
        isActive: Boolean(form.isActive),
        updatedAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'product_categories', id), { ...payload, createdAt: serverTimestamp() }, { merge: true })
      setCategories((items) => [{ id, ...payload }, ...items.filter((item) => item.id !== id)])
      setForm(emptyForm)
      toast.success('Product category saved.')
    } catch (err) {
      toast.error(err.message || 'Unable to save category.')
    } finally {
      setSaving(false)
    }
  }

  const editCategory = (category) => setForm({ ...emptyForm, ...category })

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete '${category.name}'?`)) return
    try {
      if (db && isFirebaseConfigured) await deleteDoc(doc(db, 'product_categories', category.id))
      setCategories((items) => items.filter((item) => item.id !== category.id))
      toast.success('Product category deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete category.')
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
      <form onSubmit={saveCategory} className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div>
          <h2 className="font-bold text-navy-900 dark:text-white">Product Categories</h2>
          <p className="mt-1 text-sm text-gray-500">Organize product listing filters and admin product assignment.</p>
        </div>

        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Name</span>
            <input className="field" value={form.name} onChange={(event) => update('name', event.target.value)} required />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Description</span>
            <textarea className="field min-h-24" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Sort order</span>
            <input className="field" type="number" min="1" value={form.order} onChange={(event) => update('order', event.target.value)} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} />
            Active
          </label>
          <ImageUploader
            label="Upload category image"
            useAdminStorage
            currentImageUrl={form.imageURL}
            folder={`product-category-${form.name || 'new'}`}
            onUploadComplete={(url) => update('imageURL', url)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : form.id ? <Save size={17} /> : <Layers3 size={17} />}
            {form.id ? 'Save Category' : 'Add Category'}
          </button>
          {form.id && <button type="button" className="btn-secondary" onClick={() => setForm(emptyForm)}>Clear</button>}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <h3 className="font-bold text-navy-900 dark:text-white">Categories</h3>
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-4 grid gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <div key={`product-category-skeleton-${index}`} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />)
          ) : categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm font-semibold text-gray-500 dark:border-white/10">
              No product categories yet.
            </p>
          ) : (
            categories.map((category) => (
              <article key={category.id} className="grid gap-4 rounded-xl border border-gray-100 p-4 dark:border-white/10 md:grid-cols-[88px_1fr_auto]">
                {category.imageURL ? (
                  <img src={category.imageURL} alt="" className="h-20 w-full rounded-lg object-cover md:w-20" />
                ) : (
                  <div className="grid h-20 place-items-center rounded-lg bg-amber-50 text-amber-700 md:w-20">
                    <Layers3 size={22} />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-gray-950 dark:text-white">{category.name}</h4>
                    <span className={`badge ${category.isActive === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {category.isActive === false ? 'Hidden' : 'Active'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{category.description || 'No description'} | Order {category.order || 1}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => editCategory(category)} aria-label="Edit category">
                    <Edit3 size={16} />
                  </button>
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50" onClick={() => removeCategory(category)} aria-label="Delete category">
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
