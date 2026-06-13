import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ArrowDown, ArrowUp, Edit3, Eye, Save, Trash2 } from 'lucide-react'
import { defaultHero, settings } from '../data/catalog'
import { db, isFirebaseConfigured } from '../firebase/config'
import ImageUploader from '../components/ImageUploader'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { defaultAnnouncements } from '../data/announcements'

const emptyAnnouncement = { id: '', text: '', href: '', order: 1, isActive: true }

export default function AdminSettings({ initialSection = 'company' }) {
  const { items: announcementItems, setItems: setAnnouncementItems } = useFirestoreCollection(
    'announcement_messages',
    defaultAnnouncements,
    'order',
  )
  const [section, setSection] = useState(initialSection)
  const [companyForm, setCompanyForm] = useState({
    companyName: settings.companyName,
    owner: settings.owner,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    homeTitle: 'DP Home Electric Services - Expert Electricians in Tuni',
    homeDescription: 'Book licensed electricians at your doorstep with 3-month warranty.',
    homeKeywords: 'electrician Tuni, home electrical services, fan installation, wiring repair',
    footerText: settings.footerCredit,
    logoURL: settings.logoURL || '',
  })
  const [heroForm, setHeroForm] = useState(defaultHero)
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement)
  const [saving, setSaving] = useState(false)
  const sortedAnnouncements = [...announcementItems].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return undefined
    let alive = true
    getDoc(doc(db, 'settings', 'hero'))
      .then((snap) => {
        if (alive && snap.exists()) {
          const data = snap.data()
          const slideImages = Array.isArray(data.slides) ? data.slides.map((slide) => slide.imageURL).filter(Boolean) : []
          setHeroForm((current) => ({ ...current, ...data, images: data.images || slideImages || [], slides: data.slides || [] }))
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const updateCompany = (field, value) => setCompanyForm((current) => ({ ...current, [field]: value }))
  const updateHero = (field, value) => setHeroForm((current) => ({ ...current, [field]: value }))
  const updateAnnouncement = (field, value) => setAnnouncementForm((current) => ({ ...current, [field]: value }))

  const saveCompany = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        await setDoc(doc(db, 'settings', 'contact'), {
          phone: companyForm.phone,
          whatsapp: companyForm.whatsapp,
          email: companyForm.email,
          address: companyForm.address,
          owner: companyForm.owner,
          logoURL: companyForm.logoURL,
          updatedAt: serverTimestamp(),
        })
        await setDoc(doc(db, 'settings', 'seo'), {
          homeTitle: companyForm.homeTitle,
          homeDescription: companyForm.homeDescription,
          homeKeywords: companyForm.homeKeywords,
          updatedAt: serverTimestamp(),
        })
      }
      toast.success('Settings saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const saveHero = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        await setDoc(
          doc(db, 'settings', 'hero'),
          {
            ...heroForm,
            slides: (heroForm.images || []).slice(0, 8).map((imageURL, index) => ({
              id: `hero-slide-${index + 1}`,
              imageURL,
              altText: `${settings.companyName} hero slide ${index + 1}`,
            })),
            customers: Number(heroForm.customers || 500),
            workers: Number(heroForm.workers || 50),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }
      toast.success('Hero section saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save hero settings.')
    } finally {
      setSaving(false)
    }
  }

  const saveAnnouncement = async (event) => {
    event.preventDefault()
    if (!announcementForm.text.trim()) {
      toast.error('Announcement text is required.')
      return
    }

    setSaving(true)
    try {
      const id = announcementForm.id || `announcement-${Date.now()}`
      const payload = {
        text: announcementForm.text.trim(),
        href: announcementForm.href.trim(),
        order: Number(announcementForm.order || sortedAnnouncements.length + 1),
        isActive: Boolean(announcementForm.isActive),
        updatedAt: db && isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
      }

      if (db && isFirebaseConfigured) {
        await setDoc(doc(db, 'announcement_messages', id), payload, { merge: true })
      }

      setAnnouncementItems((items) => {
        const exists = items.some((item) => item.id === id)
        return exists ? items.map((item) => (item.id === id ? { ...item, ...payload, id } : item)) : [{ id, ...payload }, ...items]
      })
      setAnnouncementForm(emptyAnnouncement)
      toast.success('Announcement saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  const removeAnnouncement = async (item) => {
    if (!window.confirm(`Delete '${item.text}'?`)) return
    try {
      if (db && isFirebaseConfigured) await deleteDoc(doc(db, 'announcement_messages', item.id))
      setAnnouncementItems((items) => items.filter((entry) => entry.id !== item.id))
      toast.success('Announcement deleted.')
    } catch (error) {
      toast.error(error.message || 'Unable to delete announcement.')
    }
  }

  const moveAnnouncement = async (item, direction) => {
    const index = sortedAnnouncements.findIndex((entry) => entry.id === item.id)
    const next = sortedAnnouncements[index + direction]
    if (!next) return

    const first = { ...item, order: Number(next.order || index + 1) }
    const second = { ...next, order: Number(item.order || index + 1) }
    try {
      if (db && isFirebaseConfigured) {
        await Promise.all([
          setDoc(doc(db, 'announcement_messages', first.id), { order: first.order, updatedAt: serverTimestamp() }, { merge: true }),
          setDoc(doc(db, 'announcement_messages', second.id), { order: second.order, updatedAt: serverTimestamp() }, { merge: true }),
        ])
      }
      setAnnouncementItems((items) =>
        items.map((entry) => (entry.id === first.id ? { ...entry, order: first.order } : entry.id === second.id ? { ...entry, order: second.order } : entry)),
      )
    } catch (error) {
      toast.error(error.message || 'Unable to reorder announcements.')
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-gray-900">
        {[
          ['company', 'Company'],
          ['hero', 'Hero Section'],
          ['announcements', 'Announcement Bar'],
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

      {section === 'company' && (
        <form onSubmit={saveCompany} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-navy-900 dark:text-white">Company & SEO Settings</h2>
              <p className="mt-1 text-sm text-gray-500">Contact info, SEO, logo and footer text.</p>
            </div>
          </div>

          <div className="mt-5 max-w-xs">
            <ImageUploader
              label="Upload company logo"
              aspectRatio="1 / 1"
              maxSizeMB={2}
              currentImageUrl={companyForm.logoURL}
              folder="settings-logo"
              onUploadComplete={(logoURL) => updateCompany('logoURL', logoURL)}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['companyName', 'Company name'],
              ['owner', 'Owner'],
              ['phone', 'Phone'],
              ['whatsapp', 'WhatsApp number'],
              ['email', 'Email'],
              ['address', 'Address'],
              ['homeTitle', 'Home meta title'],
              ['homeDescription', 'Home meta description'],
              ['homeKeywords', 'Home meta keywords'],
              ['footerText', 'Footer text'],
            ].map(([field, label]) => (
              <label key={field} className={['address', 'homeDescription', 'homeKeywords', 'footerText'].includes(field) ? 'md:col-span-2' : ''}>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                <input className="field" value={companyForm[field]} onChange={(event) => updateCompany(field, event.target.value)} />
              </label>
            ))}
          </div>

          <button type="submit" className="btn-primary mt-5" disabled={saving}><Save size={17} /> Save Settings</button>
        </form>
      )}

      {section === 'hero' && (
        <form onSubmit={saveHero} className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="font-bold text-navy-900 dark:text-white">Hero Section</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ['headline', 'Headline'],
                ['subheadline', 'Subheadline'],
                ['ctaText', 'CTA text'],
                ['ctaLink', 'CTA link'],
                ['secondaryCtaText', 'Secondary CTA'],
                ['secondaryCtaLink', 'Secondary CTA link'],
                ['badgeText', 'Badge text'],
                ['badgeText1', 'Trust badge 1'],
                ['badgeText2', 'Trust badge 2'],
                ['badgeText3', 'Trust badge 3'],
                ['badgeText4', 'Trust badge 4'],
                ['customers', 'Customers stat'],
                ['workers', 'Workers stat'],
                ['warranty', 'Warranty stat'],
                ['rating', 'Rating stat'],
              ].map(([field, label]) => (
                <label key={field} className={['headline', 'subheadline'].includes(field) ? 'md:col-span-2' : ''}>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                  <input className="field" value={heroForm[field]} onChange={(event) => updateHero(field, event.target.value)} />
                </label>
              ))}
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={heroForm.isActive} onChange={(event) => updateHero('isActive', event.target.checked)} />
                Hero active
              </label>
            </div>
            <div className="mt-5">
              <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Hero images</span>
              <ImageUploader
                label="Upload up to 8 hero images"
                multiple
                maxFiles={8}
                currentImageUrl={heroForm.images || []}
                folder="settings-hero"
                onUploadComplete={(urls) => updateHero('images', urls.slice(0, 8))}
              />
            </div>
            <button type="submit" className="btn-primary mt-5" disabled={saving}><Save size={17} /> Save Hero</button>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-navy-900 p-5 text-white shadow-sm">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-400"><Eye size={17} /> Live Preview</p>
            <p className="mt-5 inline-flex rounded-full border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-400">{heroForm.badgeText}</p>
            <h3 className="mt-5 text-3xl font-extrabold">{heroForm.headline}</h3>
            <p className="mt-3 text-sm leading-7 text-white/75">{heroForm.subheadline}</p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-navy-900">{heroForm.ctaText}</span>
              <span className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold">{heroForm.secondaryCtaText}</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(heroForm.images || []).slice(0, 4).map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt="" className={`h-28 rounded-xl object-cover ${index === 0 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          </aside>
        </form>
      )}

      {section === 'announcements' && (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={saveAnnouncement} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h2 className="font-bold text-navy-900 dark:text-white">Announcement Bar</h2>
            <p className="mt-1 text-sm text-gray-500">Public-only messages above the navbar.</p>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Message text</span>
                <input className="field" value={announcementForm.text} onChange={(event) => updateAnnouncement('text', event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Optional link</span>
                <input className="field" placeholder="tel:9398724704 or /services" value={announcementForm.href} onChange={(event) => updateAnnouncement('href', event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Sort order</span>
                <input className="field" type="number" min="1" value={announcementForm.order} onChange={(event) => updateAnnouncement('order', event.target.value)} />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={announcementForm.isActive} onChange={(event) => updateAnnouncement('isActive', event.target.checked)} />
                Active
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary" disabled={saving}><Save size={17} /> {announcementForm.id ? 'Update' : 'Add'} Message</button>
              {announcementForm.id && (
                <button type="button" className="btn-secondary" onClick={() => setAnnouncementForm(emptyAnnouncement)}>
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <h3 className="font-bold text-navy-900 dark:text-white">Messages</h3>
            <div className="mt-4 grid gap-3">
              {sortedAnnouncements.map((item) => (
                <article key={item.id} className="rounded-lg border border-gray-100 p-4 dark:border-white/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-950 dark:text-white">{item.text}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">{item.href || 'No link'} | Order {item.order} | {item.isActive === false ? 'Hidden' : 'Active'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Move up" onClick={() => moveAnnouncement(item, -1)}><ArrowUp size={16} /></button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Move down" onClick={() => moveAnnouncement(item, 1)}><ArrowDown size={16} /></button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Edit" onClick={() => setAnnouncementForm({ ...item, href: item.href || '', order: item.order || 1, isActive: item.isActive !== false })}><Edit3 size={16} /></button>
                      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50" aria-label="Delete" onClick={() => removeAnnouncement(item)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
