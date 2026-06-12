import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Save, SearchCheck } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'

const defaults = {
  homeTitle: 'Home Electric Services - Expert Electricians in Tuni',
  homeDescription: 'Book trusted electricians at your doorstep with transparent pricing and 3-month warranty.',
  homeKeywords: 'electrician Tuni, home electric service, electrical repair',
  siteUrl: '',
  ogImageURL: '',
}

export default function ManageSEO() {
  const [form, setForm] = useState(defaults)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    let alive = true
    getDoc(doc(db, 'settings', 'seo')).then((snap) => {
      if (alive && snap.exists()) setForm((current) => ({ ...current, ...snap.data() }))
    }).catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const saveSEO = async (event) => {
    event.preventDefault()
    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return
    }
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'seo'), { ...form, updatedAt: serverTimestamp() }, { merge: true })
      toast.success('SEO settings saved.')
    } catch (err) {
      toast.error(err.message || 'Unable to save SEO settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={saveSEO} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <SearchCheck size={22} />
        </span>
        <div>
          <h2 className="font-bold text-navy-900 dark:text-white">SEO Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Homepage metadata and sharing defaults.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Home title</span>
          <input className="field" value={form.homeTitle} onChange={(event) => update('homeTitle', event.target.value)} />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Home description</span>
          <textarea className="field min-h-24" value={form.homeDescription} onChange={(event) => update('homeDescription', event.target.value)} />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Keywords</span>
          <input className="field" value={form.homeKeywords} onChange={(event) => update('homeKeywords', event.target.value)} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Site URL</span>
          <input className="field" value={form.siteUrl} onChange={(event) => update('siteUrl', event.target.value)} placeholder="https://yourdomain.com" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">OG image URL</span>
          <input className="field" value={form.ogImageURL} onChange={(event) => update('ogImageURL', event.target.value)} />
        </label>
      </div>

      <button type="submit" className="btn-primary mt-5" disabled={saving}>
        <Save size={17} /> {saving ? 'Saving...' : 'Save SEO'}
      </button>
    </form>
  )
}
