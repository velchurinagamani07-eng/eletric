import { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Edit3, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { services as serviceSeed } from '../data/catalog'
import { currency } from '../utils/format'
import { getDefaultImage, getServiceImage, handleImageFallback } from '../utils/defaultImages'
import { deleteService, saveService, updateService } from '../utils/firebaseUploads'
import { apiJson, getApiBaseUrl } from '../utils/apiClient'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { useServiceCategories } from '../hooks/useServices'
import ImageUploader from '../components/ImageUploader'

const emptyForm = {
  name: '',
  category: 'fans',
  description: '',
  basePrice: '',
  duration: '',
  imageURL: '',
  images: [],
  isActive: true,
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Service name is required.'
  if (!form.category) errors.category = 'Category is required.'
  if (!form.description.trim()) errors.description = 'Description is required.'
  if (form.description.trim() && (form.description.trim().length < 20 || form.description.trim().length > 240)) {
    errors.description = 'Description must be 20-240 characters.'
  }
  if (!Number(form.basePrice) || Number(form.basePrice) < 1) errors.basePrice = 'Base price must be at least 1.'
  if (!form.duration.trim()) errors.duration = 'Duration is required.'
  if (!form.imageURL && !form.images?.length) errors.images = 'Upload at least one service image.'
  return errors
}

export default function ManageServices() {
  const { items, setItems, loading, error } = useFirestoreCollection('services', serviceSeed)
  const { categories: activeCategories } = useServiceCategories({ includeAll: false })
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState('')

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const generateDescription = async () => {
    if (getApiBaseUrl()) {
      try {
        const data = await apiJson('/api/admin/generate-description', {
          method: 'POST',
          body: { serviceName: form.name || 'Electrical Service', category: form.category },
        })
        if (data.description) {
          update('description', data.description)
          return
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error(err)
      }
    }
    update(
      'description',
      `${form.name || 'This service'} is handled by verified electricians in Tuni with safe diagnosis, clean workmanship, transparent pricing, and a 3-month service warranty.`,
    )
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId('')
  }

  const submitForm = async (event) => {
    event?.preventDefault?.()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if ((form.images?.length || 0) < 3) {
      toast('Tip: services with 3+ photos get more bookings. You can add more later from Edit.')
    }

    setSaving(true)
    try {
      console.log('[ManageServices] Saving service images:', {
        imageURL: form.imageURL,
        images: form.images,
      })
      const service = await saveService({
        form: { ...form, id: editingId || form.id },
      })
      setItems((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== service.id)
        return [service, ...withoutDuplicate]
      })
      toast.success(editingId ? 'Service updated successfully' : 'Service added successfully')
      resetForm()
    } catch (err) {
      console.error('[ManageServices] Save failed:', err)
      const message = err.message || 'Unable to save service.'
      toast.error(message, { duration: 8000 })
    } finally {
      setSaving(false)
    }
  }

  const edit = (service) => {
    setEditingId(service.id)
    setForm({
      id: service.id,
      name: service.name || '',
      category: service.category || 'fans',
      description: service.description || service.shortDescription || '',
      basePrice: service.basePrice || '',
      duration: service.duration || '',
      imageURL: service.imageURL || '',
      images: service.images || (service.imageURL ? [service.imageURL] : []),
      isActive: service.isActive !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleStatus = async (service) => {
    const isActive = service.isActive === false
    try {
      await updateService(service.id, { isActive })
      setItems((current) => current.map((item) => (item.id === service.id ? { ...item, isActive } : item)))
      toast.success(isActive ? 'Service activated.' : 'Service deactivated.')
    } catch (err) {
      toast.error(err.message || 'Unable to update service status.')
    }
  }

  const remove = async (service) => {
    if (!window.confirm(`Delete '${service.name}'? This cannot be undone.`)) return
    try {
      await deleteService(service.id)
      setItems((current) => current.filter((item) => item.id !== service.id))
      toast.success('Service deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete service.')
    }
  }

  return (
    <section className="grid gap-5">
      <form onSubmit={submitForm} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy-900 dark:text-white">{editingId ? 'Edit Service' : 'Add Service'}</h2>
            <p className="mt-1 text-sm text-gray-500">Images are compressed and uploaded with live progress before their display URLs are saved.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={generateDescription}>
            <Sparkles size={17} /> Generate Description with AI
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Field label="Service Name" error={errors.name}>
            <input className="field" value={form.name} onChange={(event) => update('name', event.target.value)} />
          </Field>
          <Field label="Category" error={errors.category}>
            <input
              className="field"
              list="service-category-options"
              placeholder="fans, wiring, ac..."
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
            />
            <datalist id="service-category-options">
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </datalist>
          </Field>
          <Field label="Base Price Rs." error={errors.basePrice}>
            <input className="field" type="number" min="1" value={form.basePrice} onChange={(event) => update('basePrice', event.target.value)} />
          </Field>
          <Field label="Duration" error={errors.duration}>
            <input className="field" placeholder="30-45 mins" value={form.duration} onChange={(event) => update('duration', event.target.value)} />
          </Field>
          <Field label="Description" error={errors.description} className="md:col-span-4">
            <textarea className="field min-h-28" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </Field>
          <Field
            label="Service Photos"
            hint="Add at least 3 photos: different angles, before/after, equipment used."
            error={errors.images}
            className="md:col-span-4"
          >
            <ImageUploader
              label="Upload service images"
              multiple
              maxFiles={6}
              folder={`service-${editingId || form.name || 'new'}`}
              currentImageUrl={form.images || (form.imageURL ? [form.imageURL] : [])}
              onUploadComplete={(urls) => {
                console.log('[ManageServices] Received uploaded image URLs:', urls)
                update('images', urls)
              }}
            />
            <PhotoProgress count={form.images?.length || 0} />
          </Field>
          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="button"
              className={`relative h-7 w-12 rounded-full transition ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
              onClick={() => update('isActive', !form.isActive)}
              aria-label="Toggle active status"
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${form.isActive ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Service active</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : editingId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
            {editingId ? 'Save Service' : 'Add Service'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-4 dark:border-white/10">
          <h2 className="font-bold text-navy-900 dark:text-white">Service Management</h2>
          {error && <p className="mt-1 text-sm font-semibold text-red-500">{error}</p>}
        </div>
        {loading ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`service-skeleton-${index}`} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <X className="mx-auto text-gray-300" size={40} />
            <p className="mt-3 font-bold text-navy-900 dark:text-white">No services yet. Add your first service!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {items.map((service) => (
                  <tr key={service.id}>
                    <td className="px-4 py-3">
                      <img
                        src={getServiceImage(service)}
                        alt={service.name}
                        onError={(event) => handleImageFallback(event, getDefaultImage(service.category))}
                        className="h-14 w-20 rounded-lg object-cover"
                      />
                    </td>
                    <td className="font-semibold text-navy-900 dark:text-white">{service.name}</td>
                    <td>{service.category}</td>
                    <td>{currency(service.basePrice)}</td>
                    <td>{service.duration || '-'}</td>
                    <td>{service.isActive !== false ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Edit service" onClick={() => edit(service)}>
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-bold ${
                            service.isActive === false ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'
                          }`}
                          onClick={() => toggleStatus(service)}
                        >
                          {service.isActive === false ? 'Enable' : 'Disable'}
                        </button>
                        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" aria-label="Delete service" onClick={() => remove(service)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
      {hint && <span className="-mt-1 mb-2 block text-xs font-semibold text-gray-400">{hint}</span>}
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-500">{error}</span>}
    </div>
  )
}

function PhotoProgress({ count }) {
  const value = Math.min(100, (Number(count || 0) / 3) * 100)
  const complete = count >= 3
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-amber-400'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${complete ? 'text-emerald-600' : 'text-amber-600'}`}>
        {count}/3
      </span>
    </div>
  )
}
