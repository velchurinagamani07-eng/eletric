import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { MapPin, MessageCircle, Minus, Phone, Plus, ShoppingCart, Trash2, UserRound } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { currency } from '../utils/format'
import { getServiceImage, handleImageFallback } from '../utils/defaultImages'
import RecommendedServices from '../components/RecommendedServices'
import { db, isFirebaseConfigured } from '../firebase/config'

const ADMIN_WHATSAPP = '919642908090'

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function cartMessage({ items, total, form }) {
  const lines = items.map((item, index) => {
    const price = Number(item.basePrice || item.price || 0)
    const quantity = Number(item.quantity || 1)
    return `${index + 1}. ${item.name} x ${quantity} - ${currency(price * quantity)}`
  })

  return [
    'New Cart Enquiry - DP Home Electric Services',
    `Name: ${form.name}`,
    `Mobile: ${cleanPhone(form.mobile)}`,
    `Address: ${form.address}`,
    form.latitude && form.longitude ? `📍 Exact Location: https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}` : '',
    `Payment Method: ${form.paymentMethod === 'online' ? 'Paid Online (Razorpay)' : 'Cash on Delivery'}`,
    `Payment Status: ${form.paymentStatus}`,
    '',
    'Selected Items:',
    ...lines,
    '',
    `Total: ${currency(total)}`,
    form.notes ? `Notes: ${form.notes}` : '',
    '',
    'Please confirm booking.',
  ].filter(Boolean).join('\n')
}

export default function Cart() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clear = useCartStore((state) => state.clear)
  const [form, setForm] = useState({ name: '', mobile: '', address: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const total = items.reduce((sum, item) => sum + Number(item.basePrice || item.price || 0) * Number(item.quantity || 1), 0)

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

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const checkout = async (event) => {
    event.preventDefault()
    if (!items.length) {
      toast.error('Add a service or product before checkout.')
      return
    }
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
      toast.error('Please enter your address.')
      return
    }

    setSubmitting(true)
    let finalCoords = coords
    if (!finalCoords && form.address.trim()) {
      finalCoords = await geocodeAddressText(form.address.trim())
    }

    const enquiry = {
      source: 'website-cart',
      name: form.name.trim(),
      mobile,
      address: form.address.trim(),
      latitude: finalCoords?.latitude || null,
      longitude: finalCoords?.longitude || null,
      notes: form.notes.trim(),
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity || 1),
        price: Number(item.basePrice || item.price || 0),
        itemType: item.itemType || 'service',
      })),
      amount: total,
      totalAmount: total,
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
          body: JSON.stringify({ amount: total })
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
        description: `Cart Checkout - ${items.length} item(s)`,
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
              const updatedEnquiry = {
                ...enquiry,
                paymentStatus: 'Paid',
                razorpayPaymentId: rzpResponse.razorpay_payment_id,
                razorpayOrderId: rzpResponse.razorpay_order_id,
              }
              await saveBookingToDatabase(updatedEnquiry)

              const successMessage = cartMessage({ items, total, form: updatedEnquiry })
              window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(successMessage)}`, '_blank', 'noopener,noreferrer')
              await clear().catch(() => {})
              toast.success('WhatsApp checkout prepared.')
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

    try {
      await saveBookingToDatabase(enquiry)
      const codMessage = cartMessage({ items, total, form: enquiry })
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(codMessage)}`, '_blank', 'noopener,noreferrer')
      await clear().catch(() => {})
      toast.success('WhatsApp checkout prepared.')
    } catch (err) {
      console.error('[Cart Save Error]', err)
      toast.error('Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Cart | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content="Review selected electrical services and send a WhatsApp checkout enquiry." />
      </Helmet>
      <main className="min-h-screen bg-[#FAFAFA] py-8 text-[#0F172A] lg:py-10">
        <div className="mx-auto w-full max-w-6xl min-w-0 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ShoppingCart size={23} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700">Cart</p>
              <h1 className="text-2xl font-extrabold md:text-3xl">Selected items</h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-8 rounded-lg border border-[#E2E8F0] bg-white p-8 text-center shadow-sm sm:p-10">
              <p className="font-bold text-[#0F172A]">Your cart is empty.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/services" className="btn-primary">Browse Services</Link>
                <Link to="/products" className="btn-secondary">Browse Products</Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
                {items.map((item) => {
                  const price = Number(item.basePrice || item.price || 0)
                  const quantity = Number(item.quantity || 1)
                  return (
                    <article key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm sm:grid-cols-[112px_minmax(0,1fr)_auto]">
                      <img src={item.imageURL || getServiceImage(item)} alt="" onError={handleImageFallback} className="aspect-[4/3] w-full max-w-full rounded-lg bg-[#F8FAFC] object-cover sm:h-24 sm:w-28" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="min-w-0 break-words font-bold text-[#0F172A]">{item.name}</h2>
                          <span className="badge bg-amber-100 text-amber-800">{item.itemType === 'product' ? 'Product' : 'Service'}</span>
                        </div>
                        <p className="mt-1 break-words text-sm text-[#64748B]">{item.shortDescription || item.description || 'Selected item'}</p>
                        <p className="mt-2 text-sm font-extrabold text-amber-700">{currency(price * quantity)}</p>
                        <div className="mt-3 inline-grid grid-cols-[34px_44px_34px] overflow-hidden rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-sm font-extrabold text-[#0F172A]">
                          <button type="button" className="grid h-9 place-items-center" aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.id, quantity - 1)}>
                            <Minus size={15} />
                          </button>
                          <span className="grid place-items-center">{quantity}</span>
                          <button type="button" className="grid h-9 place-items-center" aria-label={`Increase ${item.name}`} onClick={() => updateQuantity(item.id, quantity + 1)}>
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50 sm:self-start"
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  )
                })}
                <RecommendedServices title="Add these too?" subtitle="Quick add complementary services before checkout." />
              </section>

              <aside className="h-fit min-w-0 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm lg:sticky lg:top-24">
                <p className="text-sm font-bold text-[#0F172A]">WhatsApp checkout</p>
                <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-4 text-sm">
                  <span className="text-[#64748B]">Estimated total</span>
                  <span className="text-xl font-extrabold text-[#0F172A]">{currency(total)}</span>
                </div>
                <form className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3" onSubmit={checkout}>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-[#334155]">Name</span>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                      <input className="field min-h-11 pl-10" value={form.name} onChange={updateField('name')} placeholder="Your name" required />
                    </div>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-[#334155]">Mobile</span>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                      <input className="field min-h-11 pl-10" inputMode="tel" value={form.mobile} onChange={updateField('mobile')} placeholder="10-digit mobile" required />
                    </div>
                  </label>
                  <label>
                    <div className="mb-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-bold text-[#334155]">Address</span>
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={detectingLocation}
                        className="inline-flex max-w-full items-center gap-1 self-start whitespace-normal rounded border border-amber-600 bg-white px-2 py-0.5 text-left text-[10px] font-bold leading-4 text-amber-700 hover:bg-amber-50 disabled:opacity-50 sm:self-auto"
                      >
                        📍 {detectingLocation ? 'Locating...' : 'Use My Current Location'}
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-[#94A3B8]" size={16} />
                      <textarea className="field min-h-20 resize-y pl-10 pt-2.5" value={form.address} onChange={updateField('address')} placeholder="Area and landmark" required />
                    </div>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-[#334155]">Notes</span>
                    <textarea className="field min-h-20 resize-y" value={form.notes} onChange={updateField('notes')} placeholder="Preferred time or problem details" />
                  </label>

                  {/* Payment Method Selector */}
                  {paymentConfig.enableOnline && (
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <span className="mb-2 block text-xs font-bold text-[#334155]">Payment Method</span>
                      <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('COD')}
                          className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                            paymentMethod === 'COD'
                              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-[#0F172A]">COD</span>
                            <span className="block text-[10px] text-gray-400">Cash on delivery</span>
                          </div>
                          <span>💵</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('online')}
                          className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                            paymentMethod === 'online'
                              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-[#0F172A]">Pay Online</span>
                            <span className="block text-[10px] text-gray-400">Razorpay</span>
                          </div>
                          <span>💳</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn-primary mt-2 w-full" disabled={submitting}>
                    <MessageCircle size={17} /> {submitting ? 'Preparing...' : 'Send WhatsApp Enquiry'}
                  </button>
                </form>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
