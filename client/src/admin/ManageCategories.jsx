import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Plus, Power, Trash2 } from 'lucide-react'
import { categories as categorySeed } from '../data/catalog'
import { deleteCategory, saveCategory, updateCategory } from '../utils/firebaseUploads'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import ImageUploader from '../components/ImageUploader'

export default function ManageCategories() {
  const fallback = categorySeed.filter((category) => category.id !== 'all')
  const { items: categories, setItems: setCategories, loading, error } = useFirestoreCollection('categories', fallback, 'order')
  const [form, setForm] = useState({
    name: '',
    icon: 'Zap',
    iconURL: '',
    bannerURL: '',
    slideImage: '',
    backgroundColor: '#F59E0B',
    description: '',
    startingPrice: '',
    order: fallback.length + 1,
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setForm({
      name: '',
      icon: 'Zap',
      iconURL: '',
      bannerURL: '',
      slideImage: '',
      backgroundColor: '#F59E0B',
      description: '',
      startingPrice: '',
      order: categories.length + 2,
      isActive: true,
    })
  }

  const addCategory = async (event) => {
    event?.preventDefault?.()
    if (!form.name.trim()) {
      toast.error('Category name is required.')
      return
    }
    setSaving(true)
    try {
      const category = await saveCategory({
        form,
      })
      setCategories((items) => [category, ...items.filter((item) => item.id !== category.id)])
      reset()
      toast.success('Category saved successfully.')
    } catch (err) {
      const message = err.message || 'Category save failed.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (category) => {
    if (!window.confirm(`Delete '${category.name}'?`)) return
    try {
      await deleteCategory(category.id)
      setCategories((items) => items.filter((item) => item.id !== category.id))
      toast.success('Category deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete category.')
    }
  }

  const toggle = async (category) => {
    const isActive = !category.isActive
    try {
      await updateCategory(category.id, { isActive })
      setCategories((items) => items.map((item) => (item.id === category.id ? { ...item, isActive } : item)))
      toast.success(isActive ? 'Category enabled.' : 'Category disabled.')
    } catch (err) {
      toast.error(err.message || 'Unable to update category.')
    }
  }

  return (
    <section className="grid gap-5">
      <form onSubmit={addCategory} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <h2 className="font-bold text-navy-900 dark:text-white">Category Management</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <input className="field" placeholder="Name" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
          <input className="field" placeholder="Icon name" value={form.icon} onChange={(event) => setForm((value) => ({ ...value, icon: event.target.value }))} />
          <input className="field" placeholder="Starting price" type="number" value={form.startingPrice} onChange={(event) => setForm((value) => ({ ...value, startingPrice: event.target.value }))} />
          <input className="field" type="number" value={form.order} onChange={(event) => setForm((value) => ({ ...value, order: event.target.value }))} />
          <input className="field" type="color" value={form.backgroundColor} onChange={(event) => setForm((value) => ({ ...value, backgroundColor: event.target.value }))} aria-label="Category background color" />
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} />
            Active
          </label>
          <textarea className="field min-h-24 md:col-span-2" placeholder="Category description" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ImageUploader
            label="Icon image"
            useAdminStorage
            aspectRatio="1 / 1"
            folder={`category-${form.name || 'new'}-icon`}
            currentImageUrl={form.iconURL}
            onUploadComplete={(url) => setForm((value) => ({ ...value, iconURL: url }))}
          />
          <ImageUploader
            label="Banner image"
            useAdminStorage
            folder={`category-${form.name || 'new'}-banner`}
            currentImageUrl={form.bannerURL}
            onUploadComplete={(url) => setForm((value) => ({ ...value, bannerURL: url }))}
          />
          <ImageUploader
            label="Hero slide image"
            useAdminStorage
            folder={`category-${form.name || 'new'}-slide`}
            currentImageUrl={form.slideImage}
            onUploadComplete={(url) => setForm((value) => ({ ...value, slideImage: url }))}
          />
        </div>
        <button type="submit" className="btn-primary mt-4" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Add Category
        </button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        {error && <p className="border-b border-red-100 p-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th>Icon</th>
                <th>Hero Slide</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`category-skeleton-${index}`}>
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
                    </td>
                  </tr>
                ))
              ) : categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-semibold text-navy-900 dark:text-white">{category.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {category.iconURL && <img src={category.iconURL} alt="" className="h-8 w-8 rounded-full object-cover" />}
                      <span>{category.icon}</span>
                    </div>
                  </td>
                  <td>{category.slideImage ? <img src={category.slideImage} alt="" className="h-10 w-16 rounded-lg object-cover" /> : '-'}</td>
                  <td>{category.order}</td>
                  <td>{category.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => toggle(category)} aria-label="Toggle category">
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                        onClick={() => remove(category)}
                        aria-label="Delete category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
