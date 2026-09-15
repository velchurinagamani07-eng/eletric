import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { currency } from '../utils/format'
import toast from 'react-hot-toast'
import { CalendarDays, CheckCircle2, ClipboardCopy, Clock, MapPin, MessageCircle, Phone, QrCode, UserRound, Wrench } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { SiGooglepay, SiPaytm, SiPhonepe } from 'react-icons/si'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useServices } from '../hooks/useServices'
import { buildAppSpecificUpiUri, buildUpiPaymentUri } from '../utils/upiPayment'

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
    enableUPI: true,
    upiId: 'dileepmanepalli14@okhdfcbank',
    upiPayeeName: 'DP Home Electric Services',
    razorpayKeyId: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [upiUtr, setUpiUtr] = useState('')
  const [coords, setCoords] = useState(null)
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    if (!db || !isFirebaseConfigured) return
    getDoc(doc(db, 'settings', 'payment_public'))
      .then((snap) => {
        if (snap.exists()) {
          setPaymentConfig((prev) => ({ ...prev, ...snap.data() }))
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

    // Direct UPI / QR Code Submit
    if (paymentMethod === 'UPI') {
      try {
        const finalPayload = {
          ...payload,
          paymentMethod: 'UPI',
          paymentStatus: 'UPI Payment — Pending Verification',
          upiUtr: upiUtr.trim() || null,
          upiId: paymentConfig.upiId || 'dileepmanepalli14@okhdfcbank',
          amount: selectedService?.basePrice || 149,
          totalAmount: selectedService?.basePrice || 149,
        }
        await saveBookingToDatabase(finalPayload)

        const upiMessage = [
          'New Service Enquiry (UPI Payment) - DP Home Electric Services',
          `Name: ${payload.name}`,
          `Mobile: ${payload.mobile}`,
          `Service: ${payload.service}`,
          `Address: ${payload.address}`,
          payload.latitude && payload.longitude ? `📍 Exact Location: https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}` : '',
          `Preferred Date: ${payload.preferredDate || 'Not specified'}`,
          `Preferred Time: ${payload.preferredTime || 'Not specified'}`,
          `Payment Method: Direct UPI (PhonePe / Google Pay / QR)`,
          `UPI ID: ${paymentConfig.upiId || 'dileepmanepalli14@okhdfcbank'}`,
          upiUtr.trim() ? `Transaction ID / UTR: ${upiUtr.trim()}` : `Payment Status: Initiated via UPI`,
          `Estimated Total: ${currency(selectedService?.basePrice || 149)}`,
          payload.notes ? `Notes: ${payload.notes}` : '',
          '',
          'Please confirm booking and payment.',
        ].filter(Boolean).join('\n')

        window.open(whatsappUrl(upiMessage), '_blank', 'noopener,noreferrer')
        setConfirmed(true)
        toast.success('UPI Booking submitted! WhatsApp message prepared.')
      } catch (firestoreError) {
        console.error('[BookingForm] Save failed:', firestoreError)
        toast.error('Enquiry submission failed.')
      } finally {
        setSubmitting(false)
      }
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

          {paymentMethod === 'UPI' && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                  📱 Direct UPI Payment Details
                </span>
                <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                  Amount: {currency(selectedService?.basePrice || 149)}
                </span>
              </div>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
                <div className="rounded-lg bg-white p-2 shadow-sm shrink-0">
                  <QRCodeCanvas
                    value={buildUpiPaymentUri({
                      upiId: paymentConfig.upiId,
                      amount: selectedService?.basePrice || 149,
                      customerName: form.name,
                      payeeName: paymentConfig.upiPayeeName,
                    })}
                    size={95}
                    includeMargin
                  />
                </div>
                <div className="space-y-1 text-xs text-gray-700">
                  <p><strong>UPI ID:</strong> <span className="font-mono text-amber-900 font-bold">{paymentConfig.upiId || 'dileepmanepalli14@okhdfcbank'}</span></p>
                  <p><strong>Payee:</strong> {paymentConfig.upiPayeeName || 'DP Home Electric Services'}</p>
                  {upiUtr && <p><strong>Submitted UTR:</strong> <span className="font-mono">{upiUtr}</span></p>}
                  <p className="text-[11px] text-gray-500">You can also scan this QR anytime to complete payment.</p>
                </div>
              </div>
            </div>
          )}

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
            {(paymentConfig.enableOnline || paymentConfig.enableUPI !== false) && (
              <div className="sm:col-span-2 mt-4 border-t border-zinc-100 pt-4">
                <span className="mb-3 block text-sm font-semibold text-[#334155]">Select Payment Method</span>
                <div className={`grid gap-3 ${paymentConfig.enableOnline ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {paymentConfig.enableCOD !== false && (
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
                        <span className="block text-xs text-gray-500">Pay cash after work</span>
                      </div>
                      <span className="text-xl">💵</span>
                    </button>
                  )}

                  {paymentConfig.enableUPI !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="block font-bold text-[#0F172A]">UPI / QR / Apps</span>
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-800">0% Fee</span>
                        </div>
                        <span className="block text-xs text-gray-500">PhonePe, GPay, Paytm</span>
                      </div>
                      <span className="text-xl">📱</span>
                    </button>
                  )}

                  {paymentConfig.enableOnline && (
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
                        <span className="block text-xs text-gray-500">Cards & Netbanking</span>
                      </div>
                      <span className="text-xl">💳</span>
                    </button>
                  )}
                </div>

                {/* Direct UPI / QR Details Box */}
                {paymentMethod === 'UPI' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Instant UPI Payment
                        </span>
                        <p className="text-[11px] text-gray-500">Pay directly to our verified UPI ID</p>
                      </div>
                      <span className="text-base font-black text-amber-900">
                        {currency(selectedService?.basePrice || 149)}
                      </span>
                    </div>

                    {/* Quick App Tap Buttons */}
                    <div className="mt-3">
                      <span className="mb-2 block text-xs font-bold text-gray-700">
                        Tap to pay instantly on mobile:
                      </span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <a
                          href={buildAppSpecificUpiUri('phonepe', {
                            upiId: paymentConfig.upiId,
                            amount: selectedService?.basePrice || 149,
                            customerName: form.name,
                            payeeName: paymentConfig.upiPayeeName,
                          })}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#5f259f] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                        >
                          <SiPhonepe size={16} /> PhonePe
                        </a>
                        <a
                          href={buildAppSpecificUpiUri('gpay', {
                            upiId: paymentConfig.upiId,
                            amount: selectedService?.basePrice || 149,
                            customerName: form.name,
                            payeeName: paymentConfig.upiPayeeName,
                          })}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 shadow-sm transition hover:bg-gray-50"
                        >
                          <SiGooglepay size={20} className="text-blue-600" /> Google Pay
                        </a>
                        <a
                          href={buildAppSpecificUpiUri('paytm', {
                            upiId: paymentConfig.upiId,
                            amount: selectedService?.basePrice || 149,
                            customerName: form.name,
                            payeeName: paymentConfig.upiPayeeName,
                          })}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#002970] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                        >
                          <SiPaytm size={20} /> Paytm
                        </a>
                        <a
                          href={buildUpiPaymentUri({
                            upiId: paymentConfig.upiId,
                            amount: selectedService?.basePrice || 149,
                            customerName: form.name,
                            payeeName: paymentConfig.upiPayeeName,
                          })}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
                        >
                          <QrCode size={16} /> Any UPI App
                        </a>
                      </div>
                    </div>

                    {/* QR Code and UPI ID */}
                    <div className="mt-3.5 flex flex-col items-center gap-3.5 rounded-lg border border-amber-200/80 bg-white p-3.5 sm:flex-row">
                      <div className="shrink-0 rounded-lg border border-gray-100 bg-white p-2 shadow-inner">
                        <QRCodeCanvas
                          id="booking-form-upi-qr"
                          value={buildUpiPaymentUri({
                            upiId: paymentConfig.upiId,
                            amount: selectedService?.basePrice || 149,
                            customerName: form.name,
                            payeeName: paymentConfig.upiPayeeName,
                          })}
                          size={110}
                          includeMargin
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5 text-center text-xs sm:text-left">
                        <p className="font-bold text-gray-900">Scan with any scanner or UPI app</p>
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                          <span className="break-all rounded bg-gray-100 px-2 py-1 font-mono text-[11px] font-bold text-gray-800">
                            {paymentConfig.upiId || 'dileepmanepalli14@okhdfcbank'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentConfig.upiId || 'dileepmanepalli14@okhdfcbank')
                              toast.success('UPI ID copied!')
                            }}
                            className="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                            title="Copy UPI ID"
                          >
                            <ClipboardCopy size={13} /> Copy
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Payee: <strong>{paymentConfig.upiPayeeName || 'DP Home Electric Services'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Optional UTR input */}
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        UPI UTR / Transaction ID <span className="font-normal text-gray-400">(Optional — enter after paying)</span>
                      </label>
                      <input
                        type="text"
                        className="field min-h-10 text-xs"
                        placeholder="e.g. 12-digit UTR from PhonePe / Google Pay"
                        value={upiUtr}
                        onChange={(event) => setUpiUtr(event.target.value)}
                      />
                    </div>
                  </div>
                )}
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
