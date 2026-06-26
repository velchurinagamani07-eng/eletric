import { useEffect, useMemo, useRef, useState } from 'react'
import { deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc, collection } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'
import { BellRing, CheckCircle2, Clock, MessageCircle, Phone, Search, Trash2, XCircle } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'

const ADMIN_WHATSAPP = '919642908090'
const statuses = [
  { value: 'new', label: 'New', icon: BellRing, className: 'bg-amber-100 text-amber-800' },
  { value: 'contacted', label: 'Contacted', icon: Phone, className: 'bg-sky-100 text-sky-800' },
  { value: 'converted', label: 'Converted', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', icon: XCircle, className: 'bg-gray-100 text-gray-700' },
]

function toMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDate(value) {
  const millis = toMillis(value)
  if (!millis) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(millis))
}

function statusMeta(value) {
  return statuses.find((item) => item.value === value) || statuses[0]
}

function whatsappUrl(enquiry) {
  const mobile = String(enquiry.mobile || '').replace(/\D/g, '')
  const target = mobile.length >= 10 ? `91${mobile.slice(-10)}` : ADMIN_WHATSAPP
  const message = [
    `Hi ${enquiry.name || 'there'}, this is DP Home Electric Services.`,
    `We received your enquiry for ${enquiry.service || 'electrical service'}.`,
    'Please share photos or confirm a convenient time for service.',
  ].join('\n')
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`
}

export default function ManageEnquiries() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(db && isFirebaseConfigured))
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const knownIds = useRef(new Set())
  const readyForSound = useRef(false)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      setLoading(false)
      setError('Firebase is not configured. Enquiries will appear after Firebase environment variables are set.')
      return undefined
    }

    const unsubscribe = onSnapshot(
      collection(db, 'enquiries'),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
        const nextIds = new Set(nextItems.map((item) => item.id))
        const hasNew = nextItems.some((item) => item.status === 'new' && !knownIds.current.has(item.id))

        if (readyForSound.current && hasNew) {
          const audio = new Audio('/notification.mp3')
          audio.volume = 1
          audio.play().catch(() => {})
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New service enquiry', { body: 'Open admin enquiries to contact the customer.' })
          }
        }

        readyForSound.current = true
        knownIds.current = nextIds
        setItems(nextItems)
        setError('')
        setLoading(false)
      },
      (err) => {
        console.error('[ManageEnquiries] Firestore listener failed:', err)
        setError(err.message || 'Unable to load enquiries.')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) =>
      [item.name, item.mobile, item.service, item.address, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [items, query])

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'enquiries', id), {
        status,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Marked ${status}.`)
    } catch (err) {
      toast.error(err.message || 'Unable to update enquiry.')
    }
  }

  const deleteEnquiry = async (id) => {
    try {
      await deleteDoc(doc(db, 'enquiries', id))
      toast.success('Enquiry deleted.')
    } catch (err) {
      toast.error(err.message || 'Unable to delete enquiry.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Enquiries | Admin | DP Home Electric Services</title>
      </Helmet>
      <section className="min-w-0 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Admin Enquiries</p>
            <h2 className="mt-1 text-2xl font-extrabold text-gray-950 dark:text-white">WhatsApp booking leads</h2>
            <p className="mt-1 text-sm text-gray-500">Realtime enquiries from public booking and cart checkout.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              className="field min-h-11 pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, mobile, service"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`enquiry-loading-${index}`} className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
            ))
          ) : filtered.length ? (
            filtered.map((enquiry) => {
              const meta = statusMeta(enquiry.status)
              const StatusIcon = meta.icon
              return (
                <article key={enquiry.id} className="rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-gray-950">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-gray-950 dark:text-white">{enquiry.name || 'Customer'}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${meta.className}`}>
                          <StatusIcon size={13} /> {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{enquiry.service || 'Electrical service'}</p>
                      <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                        <p className="flex items-center gap-2"><Phone size={15} className="text-amber-600" /> {enquiry.mobile || '-'}</p>
                        <p className="flex items-center gap-2"><Clock size={15} className="text-amber-600" /> {formatDate(enquiry.createdAt)}</p>
                        <p className="sm:col-span-2">{enquiry.address || '-'}</p>
                        {enquiry.preferredDate && <p>Preferred date: {enquiry.preferredDate}</p>}
                        {enquiry.preferredTime && <p>Preferred time: {enquiry.preferredTime}</p>}
                        {enquiry.notes && <p className="sm:col-span-2">Notes: {enquiry.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <a className="btn-primary min-h-10 px-3 py-2 text-xs" href={whatsappUrl(enquiry)} target="_blank" rel="noreferrer">
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                      {statuses.filter((status) => status.value !== enquiry.status).map((status) => (
                        <button key={status.value} type="button" className="btn-secondary min-h-10 px-3 py-2 text-xs" onClick={() => updateStatus(enquiry.id, status.value)}>
                          {status.label}
                        </button>
                      ))}
                      <button type="button" className="btn-danger min-h-10 px-3 py-2 text-xs" onClick={() => deleteEnquiry(enquiry.id)}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="rounded-lg border border-dashed border-[#CBD5E1] p-8 text-center text-sm font-semibold text-gray-500">
              No enquiries found.
            </div>
          )}
        </div>
      </section>
    </>
  )
}
