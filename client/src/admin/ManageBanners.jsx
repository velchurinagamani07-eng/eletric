import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Eye, GripVertical, Loader2, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'
import { banners as bannerSeed } from '../data/catalog'
import { deleteBanner, saveBanner } from '../utils/firebaseUploads'
import { handleImageFallback } from '../utils/defaultImages'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import ImageUploader from '../components/ImageUploader'
import { db, isFirebaseConfigured } from '../firebase/config'

const emptyForm = {
  title: '',
  subtitle: '',
  ctaText: '',
  ctaLink: '/booking',
  imageURL: '',
  kind: 'festival',
  isFestival: false,
  isActive: true,
}

const emptySplash = {
  imageURL: '',
  isActive: false,
  ctaLabel: 'Continue to Website',
  ctaLink: '',
  startDate: '',
  endDate: '',
}

export default function ManageBanners({ initialSection = 'banners' }) {
  const { items, setItems, loading, error } = useFirestoreCollection('banners', bannerSeed, 'order')
  const [section, setSection] = useState(initialSection)
  const [form, setForm] = useState(emptyForm)
  const [splashForm, setSplashForm] = useState(emptySplash)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [previewBanner, setPreviewBanner] = useState(null)

  useEffect(() => {
    if (initialSection) Promise.resolve().then(() => setSection(initialSection))
  }, [initialSection])

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    let alive = true
    getDoc(doc(db, 'settings', 'splash'))
      .then((snap) => {
        if (!alive || !snap.exists()) return
        const data = snap.data()
        setSplashForm({
          imageURL: data.imageURL || '',
          isActive: Boolean(data.isActive),
          ctaLabel: data.ctaLabel || 'Continue to Website',
          ctaLink: data.ctaLink || '',
          startDate: data.startDate?.toDate?.().toISOString().slice(0, 10) || data.startDate || '',
          endDate: data.endDate?.toDate?.().toISOString().slice(0, 10) || data.endDate || '',
        })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const updateSplash = (field, value) => setSplashForm((current) => ({ ...current, [field]: value }))

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.subtitle.trim()) next.subtitle = 'Subtitle is required.'
    if (!form.ctaText.trim()) next.ctaText = 'CTA text is required.'
    if (!form.imageURL) next.image = 'Banner image is required.'
    setErrors(next)
    return next
  }

  const addBanner = async (event) => {
    event.preventDefault()
    if (Object.keys(validate()).length) return
    setSaving(true)
    try {
      const banner = await saveBanner({
        form: { ...form, order: items.length + 1 },
      })
      setItems((current) => [banner, ...current.filter((item) => item.id !== banner.id)])
      setForm(emptyForm)
      toast.success('Banner added successfully')
    } catch (err) {
      if (import.meta.env.DEV) console.error(err)
      const message = err.message || 'Unable to add banner.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const saveSplash = async (event) => {
    event.preventDefault()
    if (!splashForm.imageURL && splashForm.isActive) {
      toast.error('Upload a splash image before activating.')
      return
    }
    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return
    }

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'settings', 'splash'),
        {
          imageURL: splashForm.imageURL,
          isActive: Boolean(splashForm.isActive),
          ctaLabel: splashForm.ctaLabel || 'Continue to Website',
          ctaLink: splashForm.ctaLink || '',
          startDate: splashForm.startDate ? new Date(`${splashForm.startDate}T00:00:00`) : null,
          endDate: splashForm.endDate ? new Date(`${splashForm.endDate}T23:59:59`) : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      toast.success('Splash settings saved.')
    } catch (err) {
      toast.error(err.message || 'Unable to save splash settings.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (banner) => {
    if (!window.confirm(`Delete '${banner.title}'?`)) return
    try {
      await deleteBanner(banner.id)
      setItems((current) => current.filter((item) => item.id !== banner.id))
      toast.success('Banner deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete banner.')
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-gray-900">
        {[
          ['banners', 'Promo Banners'],
          ['splash', 'Entry Splash'],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setSection(id)}
            className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
              section === id ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'splash' && (
        <form onSubmit={saveSplash} className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="font-bold text-navy-900 dark:text-white">Entry Splash Gate</h2>
            <p className="mt-1 text-sm text-gray-500">Full-screen image shown once per session before visitors enter the website.</p>
            <div className="mt-5 grid gap-4">
              <ImageUploader
                label="Upload full-screen splash image"
                currentImageUrl={splashForm.imageURL}
                folder="settings-splash"
                onUploadComplete={(url) => updateSplash('imageURL', url)}
              />
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">CTA label</span>
                <input className="field" value={splashForm.ctaLabel} onChange={(event) => updateSplash('ctaLabel', event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">CTA link</span>
                <input className="field" placeholder="/booking or https://example.com" value={splashForm.ctaLink} onChange={(event) => updateSplash('ctaLink', event.target.value)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Start date</span>
                  <input className="field" type="date" value={splashForm.startDate} onChange={(event) => updateSplash('startDate', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">End date</span>
                  <input className="field" type="date" value={splashForm.endDate} onChange={(event) => updateSplash('endDate', event.target.value)} />
                </label>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={splashForm.isActive} onChange={(event) => updateSplash('isActive', event.target.checked)} />
                Splash active
              </label>
            </div>
            <button type="submit" className="btn-primary mt-5" disabled={saving}>
              <Save size={17} /> Save Splash
            </button>
          </div>

          <aside className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950 shadow-sm dark:border-white/10">
            {splashForm.imageURL ? (
              <div className="relative aspect-[9/14] min-h-[420px] sm:aspect-video">
                <img src={splashForm.imageURL} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-5 text-center text-white">
                  <span className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-navy-900 shadow-lg">
                    {splashForm.ctaLabel || 'Continue to Website'}
                  </span>
                  <p className="text-[11px] text-white/60">Website made by WayzenTech - 9398724704</p>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center p-6 text-center text-white/60">
                Upload an image to preview the full-screen splash.
              </div>
            )}
          </aside>
        </form>
      )}

      {section === 'banners' && (
        <>
      <form onSubmit={addBanner} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy-900 dark:text-white">Banner Management</h2>
            <p className="mt-1 text-sm text-gray-500">Images upload to ImgBB. Hero, festival, popup and promo banners all save display URLs.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Field error={errors.title}>
            <input className="field" placeholder="Title" value={form.title} onChange={(event) => update('title', event.target.value)} />
          </Field>
          <Field error={errors.subtitle}>
            <input className="field" placeholder="Subtitle" value={form.subtitle} onChange={(event) => update('subtitle', event.target.value)} />
          </Field>
          <Field error={errors.ctaText}>
            <input className="field" placeholder="CTA text" value={form.ctaText} onChange={(event) => update('ctaText', event.target.value)} />
          </Field>
          <input className="field" placeholder="CTA link" value={form.ctaLink} onChange={(event) => update('ctaLink', event.target.value)} />
          <select className="field" value={form.kind} onChange={(event) => update('kind', event.target.value)}>
            <option value="festival">Festival / Popup</option>
            <option value="hero">Hero Slide</option>
            <option value="promo">Promo Banner</option>
          </select>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.isFestival} onChange={(event) => update('isFestival', event.target.checked)} />
            Festival
          </label>
        </div>

        <div className="mt-4 max-w-xl">
          <ImageUploader
            label="Upload banner image"
            currentImageUrl={form.imageURL}
            folder={`banner-${form.kind}-${form.title || 'new'}`}
            onUploadComplete={(url) => {
              update('imageURL', url)
              setErrors((current) => ({ ...current, image: '' }))
            }}
          />
          {errors.image && <p className="mt-2 text-xs font-semibold text-red-500">{errors.image}</p>}
        </div>

        <button type="submit" className="btn-primary mt-4" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Add Banner
        </button>
      </form>

      <div className="grid gap-4">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={`banner-skeleton-${index}`} className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />)
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-gray-900">
            <p className="font-bold text-navy-900 dark:text-white">No banners yet. Add your first promo banner.</p>
          </div>
        ) : (
          items.map((banner) => (
            <article key={banner.id} className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 md:grid-cols-[160px_1fr_auto]">
              {banner.imageURL ? (
                <img src={banner.imageURL} alt={banner.title} onError={handleImageFallback} className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-400">No image</div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <GripVertical className="text-gray-400" size={17} />
                  <h3 className="font-bold text-navy-900 dark:text-white">{banner.title}</h3>
                  {banner.isFestival && (
                    <span className="badge bg-amber-100 text-amber-800">
                      <Sparkles size={13} className="mr-1" /> Festival
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{banner.subtitle}</p>
                <p className="mt-1 text-xs font-semibold text-gray-400">
                  {(banner.kind || 'festival').toUpperCase()} | {banner.ctaText} {'->'} {banner.ctaLink}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Preview banner" onClick={() => setPreviewBanner(banner)}>
                  <Eye size={16} />
                </button>
                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" aria-label="Delete banner" onClick={() => remove(banner)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4" onClick={() => setPreviewBanner(null)}>
          <div className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-950" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow" onClick={() => setPreviewBanner(null)} aria-label="Close preview">
              <X size={18} />
            </button>
            {previewBanner.imageURL && <img src={previewBanner.imageURL} alt="" className="h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-600">{previewBanner.kind || 'festival'}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-gray-950 dark:text-white">{previewBanner.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{previewBanner.subtitle}</p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </section>
  )
}

function Field({ children, error }) {
  return (
    <label>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-500">{error}</span>}
    </label>
  )
}
