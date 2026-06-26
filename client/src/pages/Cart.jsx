import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
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
    '',
    'Items:',
    ...lines,
    '',
    `Estimated Total: ${currency(total)}`,
    form.notes ? `Notes: ${form.notes}` : '',
    '',
    'Please confirm availability and final price.',
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

    const enquiry = {
      source: 'website-cart',
      name: form.name.trim(),
      mobile,
      service: 'Cart checkout',
      address: form.address.trim(),
      notes: form.notes.trim(),
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity || 1),
        price: Number(item.basePrice || item.price || 0),
        itemType: item.itemType || 'service',
      })),
      estimatedTotal: total,
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const message = cartMessage({ items, total, form: enquiry })

    setSubmitting(true)
    try {
      if (db && isFirebaseConfigured) {
        await addDoc(collection(db, 'enquiries'), enquiry)
      }
    } catch (error) {
      console.error('[Cart] Enquiry save failed:', error)
      toast.error('Saved to WhatsApp only. Admin will still receive your request.')
    } finally {
      setSubmitting(false)
    }

    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    await clear().catch(() => {})
    toast.success('WhatsApp checkout prepared.')
  }

  return (
    <>
      <Helmet>
        <title>Cart | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content="Review selected electrical services and send a WhatsApp checkout enquiry." />
      </Helmet>
      <main className="min-h-screen bg-[#FAFAFA] py-8 text-[#0F172A] lg:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="grid gap-4">
                {items.map((item) => {
                  const price = Number(item.basePrice || item.price || 0)
                  const quantity = Number(item.quantity || 1)
                  return (
                    <article key={item.id} className="grid gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm sm:grid-cols-[112px_1fr_auto]">
                      <img src={item.imageURL || getServiceImage(item)} alt="" onError={handleImageFallback} className="aspect-[4/3] w-full rounded-lg bg-[#F8FAFC] object-cover sm:h-24 sm:w-28" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-[#0F172A]">{item.name}</h2>
                          <span className="badge bg-amber-100 text-amber-800">{item.itemType === 'product' ? 'Product' : 'Service'}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#64748B]">{item.shortDescription || item.description || 'Selected item'}</p>
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
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
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

              <aside className="h-fit rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm lg:sticky lg:top-24">
                <p className="text-sm font-bold text-[#0F172A]">WhatsApp checkout</p>
                <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-4 text-sm">
                  <span className="text-[#64748B]">Estimated total</span>
                  <span className="text-xl font-extrabold text-[#0F172A]">{currency(total)}</span>
                </div>
                <form className="mt-5 grid gap-3" onSubmit={checkout}>
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
                    <span className="mb-1.5 block text-xs font-bold text-[#334155]">Address</span>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-[#94A3B8]" size={16} />
                      <textarea className="field min-h-20 resize-y pl-10 pt-2.5" value={form.address} onChange={updateField('address')} placeholder="Area and landmark" required />
                    </div>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-[#334155]">Notes</span>
                    <textarea className="field min-h-20 resize-y" value={form.notes} onChange={updateField('notes')} placeholder="Preferred time or problem details" />
                  </label>
                  <button type="submit" className="btn-primary mt-1 w-full" disabled={submitting}>
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
