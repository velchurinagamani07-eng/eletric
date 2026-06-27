import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { currency } from '../utils/format'
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
  const [paymentConfig, setPaymentConfig] = useState({
    enableCOD: true,
    enableOnline: false,
    razorpayKeyId: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [coords, setCoords] = useState(null)
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return
    getDoc(doc(db, 'settings', 'payment_public'))
      .then((snap) => {
        if (snap.exists()) {
          setPaymentConfig(snap.data())
        }
      })
      .catch((err) => console.error('Error fetching payment config:', err))
  }, [])

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ latitude, longitude })
        try {
          const provider = paymentConfig.geocodingProvider || 'Nominatim'
          const apiKey = paymentConfig.geocodingApiKey || ''
          let url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          if (provider === 'Custom' && apiKey) {
            url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${latitude}&lon=${longitude}&format=json`
          }
          const response = await fetch(url, {
            headers: { 'User-Agent': 'DPHomeElectricServices/1.0' }
          })
          const data = await response.json()
          const address = data.display_name || data.address?.road || `${latitude}, ${longitude}`
          setForm((current) => ({ ...current, address }))
          toast.success('Location detected and address updated!')
        } catch (err) {
          console.error('[Reverse Geocode Error]', err)
          setForm((current) => ({ ...current, address: `${latitude}, ${longitude}` }))
          toast.success('Coordinates captured. Enter address details.')
        } finally {
          setDetectingLocation(false)
        }
      },
      (error) => {
        console.error('[Geolocation Error]', error)
        setDetectingLocation(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied — please enter your address manually.')
        } else {
          toast.error('Unable to retrieve location. Enter address manually.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const geocodeAddressText = async (addressText) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressText)}&format=json&limit=1`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DPHomeElectricServices/1.0' }
      })
      const data = await res.json()
      if (data && data[0]) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
      }
    } catch (err) {
      console.warn('[Geocoding Fallback Error]', err)
    }
    return null
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const saveBookingToDatabase = async (payload) => {
    if (db && isFirebaseConfigured) {
      const docRef = await addDoc(collection(db, 'bookings'), payload)
      await addDoc(collection(db, 'enquiries'), {
        ...payload,
        bookingDocId: docRef.id
      })
    }
  }

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

    setSubmitting(true)
    let finalCoords = coords
    if (!finalCoords && form.address.trim()) {
      finalCoords = await geocodeAddressText(form.address.trim())
    }

    const payload = {
      source: 'website-booking',
      name: form.name.trim(),
      mobile,
      service: serviceName,
      serviceSlug: selectedService?.slug || requestedService || '',
      address: form.address.trim(),
      latitude: finalCoords?.latitude || null,
      longitude: finalCoords?.longitude || null,
      preferredDate: form.date || '',
      preferredTime: form.time || '',
      notes: form.notes.trim(),
      status: 'new',
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Cash on Delivery — Pending Collection' : 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    if (paymentMethod === 'online') {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Unable to load Razorpay Payment Gateway. Please try Cash on Delivery.')
        setSubmitting(false)
        return
      }

      let orderData
      try {
        const response = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: selectedService?.basePrice || 149 })
        })
        if (!response.ok) {
          throw new Error('Order creation failed.')
        }
        orderData = await response.json()
      } catch (err) {
        console.error(err)
        toast.error('Payment order creation failed. Please try Cash on Delivery.')
        setSubmitting(false)
        return
      }

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DP Home Electric Services',
        description: `Booking for ${serviceName}`,
        order_id: orderData.orderId,
        handler: async (rzpResponse) => {
          setSubmitting(true)
          try {
            const verifyRes = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              })
            })
            const verifyData = await verifyRes.json()
            if (verifyData.verified) {
              toast.success('Payment verified successfully!')
              const updatedPayload = {
                ...payload,
                paymentStatus: 'Paid',
                razorpayPaymentId: rzpResponse.razorpay_payment_id,
                razorpayOrderId: rzpResponse.razorpay_order_id,
                amount: selectedService?.basePrice || 149,
                totalAmount: selectedService?.basePrice || 149,
              }
              await saveBookingToDatabase(updatedPayload)

              const successMessage = [
                'New Service Booking (Paid Online) - DP Home Electric Services',
                `Name: ${payload.name}`,
                `Mobile: ${payload.mobile}`,
                `Service: ${payload.service}`,
                `Address: ${payload.address}`,
                payload.latitude && payload.longitude ? `📍 Exact Location: https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}` : '',
                `Preferred Date: ${payload.preferredDate || 'Not specified'}`,
                `Preferred Time: ${payload.preferredTime || 'Not specified'}`,
                `Payment Method: Paid Online (Razorpay)`,
                `Amount Paid: ${currency(selectedService?.basePrice || 149)}`,
                payload.notes ? `Notes: ${payload.notes}` : '',
                '',
                'Payment has been verified. Please confirm booking.',
              ].filter(Boolean).join('\n')

              window.open(whatsappUrl(successMessage), '_blank', 'noopener,noreferrer')
              setConfirmed(true)
            } else {
              toast.error('Payment verification failed.')
            }
          } catch (verifyErr) {
            console.error(verifyErr)
            toast.error('Verification failed. Admin will verify manually.')
          } finally {
            setSubmitting(false)
          }
        },
        prefill: {
          name: form.name,
          contact: mobile,
        },
        theme: {
          color: '#F59E0B',
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.')
            setSubmitting(false)
          }
        }
      }

      const rzpInstance = new window.Razorpay(options)
      rzpInstance.open()
      return
    }

    // Cash on Delivery Submit
    try {
      const finalPayload = {
        ...payload,
        amount: selectedService?.basePrice || 149,
        totalAmount: selectedService?.basePrice || 149,
      }
      await saveBookingToDatabase(finalPayload)

      const codMessage = [
        'New Service Enquiry (COD) - DP Home Electric Services',
        `Name: ${payload.name}`,
        `Mobile: ${payload.mobile}`,
        `Service: ${payload.service}`,
        `Address: ${payload.address}`,
        payload.latitude && payload.longitude ? `📍 Exact Location: https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}` : '',
        `Preferred Date: ${payload.preferredDate || 'Not specified'}`,
        `Preferred Time: ${payload.preferredTime || 'Not specified'}`,
        `Payment Method: Cash on Delivery`,
        `Estimated Total: ${currency(selectedService?.basePrice || 149)}`,
        payload.notes ? `Notes: ${payload.notes}` : '',
        '',
        'Please confirm availability and booking.',
      ].filter(Boolean).join('\n')

      window.open(whatsappUrl(codMessage), '_blank', 'noopener,noreferrer')
      setConfirmed(true)
      toast.success('WhatsApp message prepared.')
    } catch (firestoreError) {
      console.error('[BookingForm] Save failed:', firestoreError)
      toast.error('Enquiry submission failed.')
    } finally {
      setSubmitting(false)
    }
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#334155]">Address</span>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-600 px-2.5 py-1 text-xs font-bold text-amber-700 bg-white hover:bg-amber-50 disabled:opacity-50"
                >
                  📍 {detectingLocation ? 'Locating...' : 'Use My Current Location'}
                </button>
              </div>
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

            {/* Payment Method Selector */}
            {paymentConfig.enableOnline && (
              <div className="sm:col-span-2 mt-4 border-t border-zinc-100 pt-4">
                <span className="mb-3 block text-sm font-semibold text-[#334155]">Select Payment Method</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-[#0F172A]">Cash on Delivery</span>
                      <span className="block text-xs text-gray-500">Pay cash directly to worker</span>
                    </div>
                    <span className="text-xl">💵</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      paymentMethod === 'online'
                        ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-[#0F172A]">Pay Online</span>
                      <span className="block text-xs text-gray-500">Secure payments via Razorpay</span>
                    </div>
                    <span className="text-xl">💳</span>
                  </button>
                </div>
              </div>
            )}
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
