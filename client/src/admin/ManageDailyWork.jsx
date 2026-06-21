import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { CalendarDays, Camera, ImageIcon, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import { db, isFirebaseConfigured } from '../firebase/config'
import { uploadToImgBB } from '../utils/uploadToImgBB'
import {
  IMGBB_TV_API_KEY,
  createFallbackDailyWork,
  formatDateDisplay,
  getLocalDateKey,
  normalizeDailyWork,
  toSchedulePayload,
} from '../utils/dailyWork'

function createEmptyEntry() {
  return {
    id: `entry-${Date.now()}`,
    time: '09:00',
    activity: '',
    location: '',
    notes: '',
    tvPhotos: [],
  }
}

export default function ManageDailyWork() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey())
  const [form, setForm] = useState(() => createFallbackDailyWork(selectedDate))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})

  useEffect(() => {
    const fallback = createFallbackDailyWork(selectedDate)

    if (!db || !isFirebaseConfigured) {
      Promise.resolve().then(() => setForm(fallback))
      return undefined
    }

    const unsubscribe = onSnapshot(
      doc(db, 'daily_work', selectedDate),
      (snapshot) => {
        setForm(snapshot.exists() ? normalizeDailyWork({ ...snapshot.data(), id: snapshot.id }, selectedDate) : fallback)
      },
      () => setForm(fallback),
    )

    return unsubscribe
  }, [selectedDate])

  const sortedEntries = useMemo(() => form.entries || [], [form.entries])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateEntry = (entryId, field, value) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry) => (entry.id === entryId ? { ...entry, [field]: value } : entry)),
    }))
  }

  const addEntry = () => {
    setForm((current) => ({ ...current, entries: [...current.entries, createEmptyEntry()] }))
  }

  const removeEntry = (entryId) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
    }))
  }

  const saveSchedule = async (event, overrideForm = form, silent = false) => {
    event?.preventDefault()

    if (!db || !isFirebaseConfigured) {
      toast.error('Firestore is not configured.')
      return false
    }

    const payload = toSchedulePayload({ ...overrideForm, scheduleDate: selectedDate })
    if (!payload.entries.length || payload.entries.some((entry) => !entry.time || !entry.activity)) {
      toast.error('Every schedule entry needs a time and activity.')
      return false
    }

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'daily_work', selectedDate),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      if (!silent) toast.success('Daily work schedule saved.')
      return true
    } catch (err) {
      toast.error(err.message || 'Unable to save daily work.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const uploadEntryPhotos = async (entryId, fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const entry = form.entries.find((item) => item.id === entryId)
    if (!entry) return

    const existingPhotos = entry.tvPhotos || []
    const remaining = Math.max(0, 10 - existingPhotos.length)
    if (!remaining) {
      toast.error('Maximum 10 TV photos reached for this entry.')
      return
    }

    const selectedFiles = files.slice(0, remaining)
    const uploadedPhotos = []

    try {
      for (const file of selectedFiles) {
        setUploading((current) => ({ ...current, [entryId]: { fileName: file.name, progress: 0 } }))
        const result = await uploadToImgBB(file, {
          apiKey: IMGBB_TV_API_KEY,
          maxWidth: 1400,
          maxSizeKB: 300,
          name: `daily-work-${selectedDate}-${entryId}-${Date.now()}`,
          onProgress: (progress) =>
            setUploading((current) => ({ ...current, [entryId]: { fileName: file.name, progress } })),
        })
        uploadedPhotos.push({
          id: `photo-${Date.now()}-${uploadedPhotos.length}`,
          url: result.url,
          thumbUrl: result.thumbUrl || result.url,
          deleteUrl: result.deleteUrl || '',
          caption: entry.activity || '',
          uploadedAt: new Date().toISOString(),
        })
      }

      const nextForm = {
        ...form,
        entries: form.entries.map((item) =>
          item.id === entryId
            ? { ...item, tvPhotos: [...existingPhotos, ...uploadedPhotos].slice(0, 10) }
            : item,
        ),
      }
      setForm(nextForm)
      await saveSchedule(null, nextForm, true)
      toast.success(`${uploadedPhotos.length} TV photo${uploadedPhotos.length === 1 ? '' : 's'} uploaded.`)
    } catch (err) {
      toast.error(err.message || 'Unable to upload TV photos.')
    } finally {
      setUploading((current) => {
        const next = { ...current }
        delete next[entryId]
        return next
      })
    }
  }

  const removePhoto = async (entryId, photoId) => {
    const nextForm = {
      ...form,
      entries: form.entries.map((entry) =>
        entry.id === entryId
          ? { ...entry, tvPhotos: (entry.tvPhotos || []).filter((photo) => photo.id !== photoId) }
          : entry,
      ),
    }
    setForm(nextForm)
    await saveSchedule(null, nextForm, true)
  }

  return (
    <form onSubmit={saveSchedule} className="grid gap-5">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Daily Work</p>
            <h2 className="mt-1 text-2xl font-black text-navy dark:text-white">Schedule and TV display</h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">{formatDateDisplay(selectedDate)}</p>
          </div>
          <a
            href="/tv"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-black text-navy hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:text-white"
          >
            <ImageIcon size={17} /> Open TV
          </a>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
          <label>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
              <CalendarDays size={16} /> Date
            </span>
            <input
              type="date"
              className="field"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value || getLocalDateKey())}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Page title</span>
            <input className="field" value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Greeting</span>
            <input className="field" value={form.greeting} onChange={(event) => updateField('greeting', event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">MLA title</span>
            <input className="field" value={form.mlaTitle} onChange={(event) => updateField('mlaTitle', event.target.value)} />
          </label>
          <div className="lg:col-span-2">
            <ImageUploader
              label="Upload top banner image"
              currentImageUrl={form.bannerImageUrl}
              folder={`daily-work-banner-${selectedDate}`}
              onUploadComplete={(url) => updateField('bannerImageUrl', url)}
            />
          </div>
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Closing note</span>
            <textarea className="field min-h-24" value={form.closingNote} onChange={(event) => updateField('closingNote', event.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-navy dark:text-white">Schedule Entries</h2>
            <p className="mt-1 text-sm text-gray-500">TV photos appear on the right panel when the event is current or completed.</p>
          </div>
          <button type="button" className="btn-secondary min-h-12" onClick={addEntry}>
            <Plus size={17} /> Add Entry
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {sortedEntries.map((entry, index) => {
            const uploadState = uploading[entry.id]
            const photos = entry.tvPhotos || []

            return (
              <article key={entry.id} className="rounded-lg border border-gray-200 bg-surface p-4 dark:border-white/10 dark:bg-gray-950">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-navy dark:text-white">Entry {index + 1}</h3>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    onClick={() => removeEntry(entry.id)}
                    aria-label="Remove schedule entry"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[150px_1fr_1fr]">
                  <label>
                    <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Time</span>
                    <input type="time" className="field" value={entry.time} onChange={(event) => updateEntry(entry.id, 'time', event.target.value)} />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Activity</span>
                    <input className="field" value={entry.activity} onChange={(event) => updateEntry(entry.id, 'activity', event.target.value)} />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Location</span>
                    <input className="field" value={entry.location} onChange={(event) => updateEntry(entry.id, 'location', event.target.value)} />
                  </label>
                  <label className="md:col-span-3">
                    <span className="mb-2 block text-sm font-bold text-gray-600 dark:text-gray-300">Notes</span>
                    <textarea className="field min-h-20" value={entry.notes} onChange={(event) => updateEntry(entry.id, 'notes', event.target.value)} />
                  </label>
                </div>

                <div className="mt-5 rounded-lg border border-dashed border-amber-300 bg-white p-4 dark:border-amber-500/40 dark:bg-gray-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-amber-700">Work Done Photos</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">Uploaded ({photos.length}/10)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-black text-navy shadow-sm hover:bg-amber-400">
                        <Camera size={18} /> Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="sr-only"
                          onChange={(event) => {
                            uploadEntryPhotos(entry.id, event.target.files)
                            event.target.value = ''
                          }}
                        />
                      </label>
                      <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-navy hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-gray-950 dark:text-white">
                        <Upload size={18} /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(event) => {
                            uploadEntryPhotos(entry.id, event.target.files)
                            event.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {uploadState && (
                    <div className="mt-3 rounded-lg bg-amber-50 p-3">
                      <div className="flex items-center justify-between text-xs font-black text-amber-800">
                        <span className="truncate">{uploadState.fileName}</span>
                        <span>{uploadState.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${uploadState.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {photos.map((photo) => (
                        <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-950">
                          <img src={photo.thumbUrl || photo.url} alt="" className="h-28 w-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-red-600 shadow"
                            onClick={() => removePhoto(entry.id, photo.id)}
                            aria-label="Delete TV photo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="btn-primary min-h-12 px-6" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Daily Work'}
        </button>
      </div>
    </form>
  )
}
