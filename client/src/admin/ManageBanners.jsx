import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ImageIcon, Save, Sparkles } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import { db, isFirebaseConfigured } from '../firebase/config'

const emptySplash = {
  imageURL: '',
  badgeText: 'Welcome Offer',
  headline: 'Welcome to DP Home Electric Services',
  subtext: 'Book verified electricians in Tuni with transparent pricing and warranty.',
  isActive: false,
  ctaLabel: 'Continue to Website',
  ctaLink: '',
  startDate: '',
  endDate: '',
}

export default function ManageBanners() {
  const [splashForm, setSplashForm] = useState(emptySplash)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    let alive = true
    getDoc(doc(db, 'settings', 'splash'))
      .then((snap) => {
        if (!alive || !snap.exists()) return
        const data = snap.data()
        setSplashForm({
          imageURL: data.imageURL || '',
          badgeText: data.badgeText || 'Welcome Offer',
          headline: data.headline || 'Welcome to DP Home Electric Services',
          subtext: data.subtext || '',
          isActive: Boolean(data.isActive),
          ctaLabel: data.ctaLabel || data.ctaText || 'Continue to Website',
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

  const updateSplash = (field, value) => setSplashForm((current) => ({ ...current, [field]: value }))

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
          badgeText: splashForm.badgeText.trim(),
          headline: splashForm.headline.trim(),
          subtext: splashForm.subtext.trim(),
          isActive: Boolean(splashForm.isActive),
          ctaLabel: splashForm.ctaLabel || 'Continue to Website',
          ctaLink: splashForm.ctaLink || '',
          startDate: splashForm.startDate ? new Date(`${splashForm.startDate}T00:00:00`) : null,
          endDate: splashForm.endDate ? new Date(`${splashForm.endDate}T23:59:59`) : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      toast.success('Entry splash saved.')
    } catch (err) {
      toast.error(err.message || 'Unable to save entry splash.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
      <form onSubmit={saveSplash} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <h2 className="flex items-center gap-2 font-bold text-navy-900 dark:text-white">
          <Sparkles size={18} /> Entry Splash
        </h2>
        <p className="mt-1 text-sm text-gray-500">Full-screen image shown once per visitor session before the public website opens.</p>
        <div className="mt-5 grid gap-4">
          <ImageUploader
            label="Upload full-screen splash image"
            useAdminStorage
            currentImageUrl={splashForm.imageURL}
            folder="settings-splash"
            onUploadComplete={(url) => updateSplash('imageURL', url)}
          />
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Badge text</span>
            <input className="field" value={splashForm.badgeText} onChange={(event) => updateSplash('badgeText', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Headline</span>
            <input className="field" value={splashForm.headline} onChange={(event) => updateSplash('headline', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Subtext</span>
            <textarea className="field min-h-24" value={splashForm.subtext} onChange={(event) => updateSplash('subtext', event.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">CTA label</span>
              <input className="field" value={splashForm.ctaLabel} onChange={(event) => updateSplash('ctaLabel', event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">CTA link</span>
              <input className="field" placeholder="/booking or https://example.com" value={splashForm.ctaLink} onChange={(event) => updateSplash('ctaLink', event.target.value)} />
            </label>
          </div>
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
          <Save size={17} /> {saving ? 'Saving...' : 'Save Entry Splash'}
        </button>
      </form>

      <aside className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950 shadow-sm dark:border-white/10">
        {splashForm.imageURL ? (
          <div className="relative min-h-[520px]">
            <img src={splashForm.imageURL} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-8 px-6 text-center text-white">
              {splashForm.badgeText && <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-navy-900">{splashForm.badgeText}</span>}
              <h3 className="mt-3 text-3xl font-extrabold">{splashForm.headline || 'Welcome to DP Home Electric Services'}</h3>
              {splashForm.subtext && <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/80">{splashForm.subtext}</p>}
              <span className="mt-5 inline-flex rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-navy-900 shadow-lg">
                {splashForm.ctaLabel || 'Continue to Website'}
              </span>
              <p className="mt-4 text-[11px] text-white/60">Website made by WayzenTech Contact 9398724704</p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[520px] place-items-center p-6 text-center text-white/60">
            <div>
              <ImageIcon className="mx-auto mb-3" size={34} />
              Upload an image to preview the full-screen splash.
            </div>
          </div>
        )}
      </aside>
    </section>
  )
}
