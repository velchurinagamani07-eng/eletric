import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Edit3, Loader2, Plus, Power, Trash2, X, Check } from 'lucide-react'
import { categories as categorySeed } from '../data/catalog'
import { deleteCategory, saveCategory, updateCategory } from '../utils/firebaseUploads'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { getCategoryIcon } from '../utils/categoryIcons'
import ImageUploader from '../components/ImageUploader'

const emptyForm = {
  name: '',
  slug: '',
  icon: 'Zap',
  iconURL: '',
  bannerURL: '',
  slideImage: '',
  backgroundColor: '#F59E0B',
  description: '',
  startingPrice: '',
  order: '',
  isActive: true,
}

export default function ManageCategories() {
  const fallback = categorySeed.filter((category) => category.id !== 'all')
  const { items: categories, setItems: setCategories, loading, error } = useFirestoreCollection('categories', fallback, 'order')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState('')

  // Sort categories by order ascending
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = Number(a.order ?? 999)
      const orderB = Number(b.order ?? 999)
      return orderA - orderB
    })
  }, [categories])

  const reset = () => {
    setForm(emptyForm)
    setEditingId('')
  }

  const startEdit = (category) => {
    setEditingId(category.id)
    setForm({
      name: category.name || '',
      slug: category.slug || category.id || '',
      icon: category.icon || 'Zap',
      iconURL: category.iconURL || '',
      bannerURL: category.bannerURL || '',
      slideImage: category.slideImage || '',
      backgroundColor: category.backgroundColor || '#F59E0B',
      description: category.description || '',
      startingPrice: category.startingPrice ?? '',
      order: category.order ?? (categories.length + 1),
      isActive: category.isActive !== undefined ? category.isActive : (category.active !== false),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event?.preventDefault?.()
    if (!form.name.trim()) {
      toast.error('Category name is required.')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const payload = {
          name: form.name.trim(),
          slug: form.slug?.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          icon: form.icon || 'Zap',
          iconURL: form.iconURL || '',
          bannerURL: form.bannerURL || '',
          slideImage: form.slideImage || '',
          backgroundColor: form.backgroundColor || '#F59E0B',
          description: form.description || '',
          startingPrice: Number(form.startingPrice || 0),
          order: Number(form.order || 1),
          isActive: Boolean(form.isActive),
          active: Boolean(form.isActive),
        }
        await updateCategory(editingId, payload)
        setCategories((items) =>
          items.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
        )
        reset()
        toast.success('Category updated successfully.')
      } else {
        const category = await saveCategory({ form })
        setCategories((items) => [category, ...items.filter((item) => item.id !== category.id)])
        reset()
        toast.success('Category saved successfully.')
      }
    } catch (err) {
      const message = err.message || 'Category save failed.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const moveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return

    const currentCat = sortedCategories[index]
    const targetCat = sortedCategories[targetIndex]
    if (!currentCat || !targetCat) return

    setMovingId(currentCat.id)

    // Calculate new orders
    let currentOrder = Number(currentCat.order ?? index + 1)
    let targetOrder = Number(targetCat.order ?? targetIndex + 1)

    // If both have same order, space them properly
    if (currentOrder === targetOrder) {
      currentOrder = direction === 'up' ? targetOrder - 1 : targetOrder + 1
    } else {
      // Swap orders
      const temp = currentOrder
      currentOrder = targetOrder
      targetOrder = temp
    }

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === currentCat.id) return { ...c, order: currentOrder }
        if (c.id === targetCat.id) return { ...c, order: targetOrder }
        return c
      })
    )

    try {
      await Promise.all([
        updateCategory(currentCat.id, { order: currentOrder }),
        updateCategory(targetCat.id, { order: targetOrder }),
      ])
      toast.success(`Moved ${currentCat.name} ${direction}.`)
    } catch (err) {
      toast.error('Failed to update category order in Firestore.')
      // Revert if error
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === currentCat.id) return { ...c, order: currentCat.order }
          if (c.id === targetCat.id) return { ...c, order: targetCat.order }
          return c
        })
      )
    } finally {
      setMovingId('')
    }
  }

  const remove = async (category) => {
    if (!window.confirm(`Delete '${category.name}'? This cannot be undone.`)) return
    try {
      await deleteCategory(category.id)
      setCategories((items) => items.filter((item) => item.id !== category.id))
      if (editingId === category.id) reset()
      toast.success('Category deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete category.')
    }
  }

  const toggle = async (category) => {
    const isCurrentlyActive = category.isActive !== undefined ? category.isActive : (category.active !== false)
    const nextActive = !isCurrentlyActive
    try {
      await updateCategory(category.id, { isActive: nextActive, active: nextActive })
      setCategories((items) =>
        items.map((item) => (item.id === category.id ? { ...item, isActive: nextActive, active: nextActive } : item))
      )
      toast.success(nextActive ? 'Category enabled.' : 'Category disabled.')
    } catch (err) {
      toast.error(err.message || 'Unable to update category.')
    }
  }

  return (
    <section className="grid gap-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organize service categories, re-order display sequence, and manage pricing defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {categories.length} Total Categories
          </span>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Category Edit / Add Form */}
      <form
        onSubmit={handleSubmit}
        className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-gray-900 ${
          editingId
            ? 'border-amber-400 ring-2 ring-amber-400/20 dark:border-amber-500'
            : 'border-gray-200 dark:border-white/10'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-bold text-navy-900 dark:text-white flex items-center gap-2">
            {editingId ? (
              <>
                <Edit3 className="text-amber-500" size={18} /> Edit Category:{' '}
                <span className="text-amber-600 dark:text-amber-400">{form.name || editingId}</span>
              </>
            ) : (
              <>
                <Plus className="text-emerald-500" size={18} /> Add New Category
              </>
            )}
          </h2>
          {editingId && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md">
              Editing ID: {editingId}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Category Name *</label>
            <input
              className="field w-full"
              placeholder="e.g. Plumbing Services"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Icon Key / Name</label>
            <input
              className="field w-full"
              placeholder="e.g. Wrench, Fan, Cable, Droplets"
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Starting Price (₹)</label>
            <input
              className="field w-full"
              placeholder="e.g. 149"
              type="number"
              value={form.startingPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, startingPrice: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Display Order</label>
            <input
              className="field w-full"
              placeholder="1, 2, 3..."
              type="number"
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-transparent p-1 dark:border-white/10"
                type="color"
                value={form.backgroundColor}
                onChange={(e) => setForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                aria-label="Category background color"
              />
              <span className="text-xs font-mono text-gray-500">{form.backgroundColor}</span>
            </div>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-amber-500"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active on Website & App
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Short Description</label>
            <textarea
              className="field w-full min-h-16"
              rows={2}
              placeholder="Brief summary shown in service catalogs..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ImageUploader
            label="Icon Image (Optional)"
            aspectRatio="1 / 1"
            folder={`category-${form.name || 'new'}-icon`}
            currentImageUrl={form.iconURL}
            onUploadComplete={(url) => setForm((prev) => ({ ...prev, iconURL: url }))}
          />
          <ImageUploader
            label="Banner Image (Optional)"
            folder={`category-${form.name || 'new'}-banner`}
            currentImageUrl={form.bannerURL}
            onUploadComplete={(url) => setForm((prev) => ({ ...prev, bannerURL: url }))}
          />
          <ImageUploader
            label="Hero Slide Image (Optional)"
            folder={`category-${form.name || 'new'}-slide`}
            currentImageUrl={form.slideImage}
            onUploadComplete={(url) => setForm((prev) => ({ ...prev, slideImage: url }))}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={17} /> Saving...
              </>
            ) : editingId ? (
              <>
                <Check size={17} /> Save Category Changes
              </>
            ) : (
              <>
                <Plus size={17} /> Add Category
              </>
            )}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Categories Table with Reordering */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-navy-900 dark:text-white">Active Categories & Order</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Categories appear on the website and mobile app in this exact sequence. Use the Up/Down arrows to change ordering.
            </p>
          </div>
        </div>

        {error && <p className="border-b border-red-100 p-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-center w-28">Order</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Starting Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`category-skeleton-${index}`}>
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
                    </td>
                  </tr>
                ))
              ) : sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category)
                  const isActive = category.isActive !== undefined ? category.isActive : (category.active !== false)
                  const isCurrentEditing = editingId === category.id

                  return (
                    <tr
                      key={category.id}
                      className={`transition-colors ${
                        isCurrentEditing
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : 'hover:bg-gray-50/60 dark:hover:bg-white/5'
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0 || movingId === category.id}
                            onClick={() => moveOrder(index, 'up')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-navy-900 disabled:opacity-30 disabled:pointer-events-none dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-navy-900 dark:text-white">
                            {category.order ?? index + 1}
                          </span>
                          <button
                            type="button"
                            disabled={index === sortedCategories.length - 1 || movingId === category.id}
                            onClick={() => moveOrder(index, 'down')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-navy-900 disabled:opacity-30 disabled:pointer-events-none dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Category Info & Icon */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 text-navy-800 shadow-xs dark:border-white/10 dark:text-white"
                            style={{ backgroundColor: category.backgroundColor ? `${category.backgroundColor}25` : '#f3f4f6' }}
                          >
                            {category.iconURL ? (
                              <img src={category.iconURL} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <IconComponent size={20} style={{ color: category.backgroundColor || 'inherit' }} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                              {category.name}
                              {category.id === 'plumbing' && (
                                <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              Slug: <code className="text-gray-600 dark:text-gray-300">{category.slug || category.id}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Starting Price */}
                      <td className="px-4 py-3 font-medium text-navy-900 dark:text-white">
                        {category.startingPrice ? `₹${category.startingPrice}` : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-navy-900 dark:text-gray-300 dark:hover:bg-white/10"
                            onClick={() => startEdit(category)}
                            title="Edit Category"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                              isActive
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            onClick={() => toggle(category)}
                            title={isActive ? 'Disable Category' : 'Enable Category'}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => remove(category)}
                            title="Delete Category"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
