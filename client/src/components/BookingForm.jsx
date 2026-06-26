import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { CalendarDays, CheckCircle2, Clock, MapPin, MessageCircle, Phone, UserRound, Wrench } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useServices } from '../hooks/useServices'

const ADMIN_WHATSAPP = '919642908090'
const PUBLIC_PHONE = '9493745479'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function serviceLabelFromSlug(slug = '') {
  return String(slug || 'selected-service')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function whatsappUrl(message) {
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`
}

export default function BookingForm() {
  const { serviceSlug } = useParams()
  const [params] = useSearchParams()
  const requestedService = serviceSlug || params.get('service') || ''
  const { services, loading, error } = useServices()
  const selectedService = useMemo(
    () =>
      services.find((service) => [service.slug, service.id, service.serviceId].filter(Boolean).includes(requestedService)) ||
      services.find((service) => service.name?.toLowerCase() === requestedService.toLowerCase()),
    [requestedService, services],
  )

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    service: selectedService?.name || serviceLabelFromSlug(requestedService),
    address: '',
    date: today(),
    time: 'Any time',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const serviceName = form.service || selectedService?.name || serviceLabelFromSlug(requestedService)

  useEffect(() => {
    if (!selectedService?.name) return
    setForm((current) => {
      const placeholder = serviceLabelFromSlug(requestedService)
      if (current.service && current.service !== placeholder) return current
      return { ...current, service: selectedService.name }
    })
  }, [requestedService, selectedService?.name])

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const mobile = cleanPhone(form.mobile)
    if (!form.name.trim()) {
      toast.error('Please enter your name.')
      return
    }
    if (mobile.length < 10) {
      toast.error('Please enter a valid mobile number.')
      return
    }
    if (!form.address.trim()) {
      toast.error('Please enter your service address.')
      return
    }

    const payload = {
      source: 'website-booking',
      name: form.name.trim(),
      mobile,
      service: serviceName,
      serviceSlug: selectedService?.slug || requestedService || '',
      address: form.address.trim(),
      preferredDate: form.date || '',
      preferredTime: form.time || '',
      notes: form.notes.trim(),
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const message = [
      'New Service Enquiry - DP Home Electric Services',
      `Name: ${payload.name}`,
      `Mobile: ${payload.mobile}`,
      `Service: ${payload.service}`,
      `Address: ${payload.address}`,
      `Preferred Date: ${payload.preferredDate || 'Not specified'}`,
      `Preferred Time: ${payload.preferredTime || 'Not specified'}`,
      payload.notes ? `Notes: ${payload.notes}` : '',
      '',
      'Please confirm availability and estimate.',
    ].filter(Boolean).join('\n')

    setSubmitting(true)
    try {
      if (db && isFirebaseConfigured) {
        await addDoc(collection(db, 'enquiries'), payload)
      }
    } catch (firestoreError) {
      console.error('[BookingForm] Enquiry save failed:', firestoreError)
      toast.error('Saved to WhatsApp only. Admin will still receive your request.')
    } finally {
      setSubmitting(false)
    }

    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
    setConfirmed(true)
    toast.success('WhatsApp message prepared.')
  }

  if (confirmed) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-4 py-10 text-[#0F172A]">
        <Helmet>
          <title>Booking Sent | DP Home Electric Services</title>
        </Helmet>
        <section className="mx-auto max-w-2xl rounded-lg border border-[#E2E8F0] bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Your enquiry is ready on WhatsApp</h1>
          <p className="mt-3 text-sm leading-6 text-[#475569]">
            Send the WhatsApp message to DP Home Electric Services. Our team will call back and confirm availability, price and warranty details.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a className="btn-primary" href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Open WhatsApp
            </a>
            <a className="btn-secondary" href={`tel:+91${PUBLIC_PHONE}`}>
              <Phone size={18} /> Call Now
            </a>
            <Link className="btn-secondary" to="/services">
              Browse Services
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-8 text-[#0F172A] lg:py-10">
      <Helmet>
        <title>Book Service | DP Home Electric Services</title>
        <meta name="description" content="Book DP Home Electric Services by sending a WhatsApp enquiry. No customer login required." />
      </Helmet>
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="h-fit rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-700">WhatsApp booking</p>
          <h1 className="mt-3 text-3xl font-extrabold">Book an electrician without login</h1>
          <p className="mt-3 text-sm leading-6 text-[#475569]">
            Fill the details once. We create an admin enquiry when possible and open WhatsApp with the same request.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-[#334155]">
            <p className="flex items-center gap-2"><Phone size={17} className="text-amber-700" /> Call: +91 {PUBLIC_PHONE}</p>
            <p className="flex items-center gap-2"><MessageCircle size={17} className="text-amber-700" /> WhatsApp: +{ADMIN_WHATSAPP}</p>
            <p className="flex items-center gap-2"><Wrench size={17} className="text-amber-700" /> 3-month service warranty on eligible work</p>
          </div>
          {loading && <p className="mt-4 text-xs text-[#64748B]">Loading service list...</p>}
          {error && <p className="mt-4 text-xs text-amber-700">Service data is unavailable, but booking still works.</p>}
        </aside>

        <form className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Name</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                <input className="field min-h-12 pl-11" value={form.name} onChange={updateField('name')} placeholder="Your name" required />
              </div>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Mobile</span>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                <input className="field min-h-12 pl-11" inputMode="tel" value={form.mobile} onChange={updateField('mobile')} placeholder="10-digit mobile" required />
              </div>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Service</span>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                <input className="field min-h-12 pl-11" value={serviceName} onChange={updateField('service')} placeholder="Service required" required />
              </div>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Address</span>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-[#94A3B8]" size={17} />
                <textarea className="field min-h-24 resize-y pl-11 pt-3" value={form.address} onChange={updateField('address')} placeholder="House no, area, landmark" required />
              </div>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Preferred Date</span>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                <input className="field min-h-12 pl-11" type="date" min={today()} value={form.date} onChange={updateField('date')} />
              </div>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Preferred Time</span>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                <select className="field min-h-12 pl-11" value={form.time} onChange={updateField('time')}>
                  <option>Any time</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Urgent today</option>
                </select>
              </div>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-[#334155]">Notes</span>
              <textarea className="field min-h-24 resize-y" value={form.notes} onChange={updateField('notes')} placeholder="Problem details, product count, photos via WhatsApp, etc." />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" className="btn-primary min-h-12 flex-1" disabled={submitting}>
              <MessageCircle size={18} /> {submitting ? 'Preparing...' : 'Submit & Open WhatsApp'}
            </button>
            <Link to="/services" className="btn-secondary min-h-12">
              View Services
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
