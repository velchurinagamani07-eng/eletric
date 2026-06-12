import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { settings } from '../data/catalog'
import { useServices } from '../hooks/useServices'

export default function Contact() {
  const { services } = useServices({ onlyActive: true })
  const [form, setForm] = useState({ name: '', mobile: '', email: '', service: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name || !form.mobile || !form.message) {
      toast.error('Name, mobile and message are required.')
      return
    }
    setSubmitting(true)
    try {
      const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
      if (baseURL) {
        const response = await fetch(`${baseURL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!response.ok) throw new Error('Contact submission failed.')
      }
      toast.success('Message sent. We will contact you soon.')
      setForm({ name: '', mobile: '', email: '', service: '', message: '' })
    } catch (error) {
      toast.error(error.message || 'Unable to send message.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact Us - Home Electric Services Tuni | +91 9493745479</title>
        <meta
          name="description"
          content="Contact Home Electric Services in Tuni for fan installation, wiring, AC fitting, inverter and electrical repairs. Call +91 9493745479."
        />
      </Helmet>
      <main className="bg-gray-50 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Contact</p>
            <h1 className="mt-2 text-4xl font-extrabold text-navy-900 dark:text-white">Talk to Home Electric Services</h1>
          </div>
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">Service desk</h2>
              <div className="mt-5 grid gap-4 text-sm text-gray-600 dark:text-gray-300">
                <a className="flex items-center gap-3 hover:text-amber-700" href={`tel:+91${settings.phone}`}>
                  <Phone className="text-amber-600" size={19} /> +91 {settings.phone}
                </a>
                <a className="flex items-center gap-3 hover:text-amber-700" href={`https://wa.me/91${settings.whatsapp}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="text-emerald-600" size={19} /> WhatsApp support
                </a>
                <a className="flex items-center gap-3 hover:text-amber-700" href={`mailto:${settings.email}`}>
                  <Mail className="text-blue-600" size={19} /> {settings.email}
                </a>
                <p className="flex items-center gap-3">
                  <MapPin className="text-red-500" size={19} /> {settings.address}
                </p>
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                <iframe
                  title="Tuni map"
                  src="https://www.google.com/maps?q=Tuni%2C%20Andhra%20Pradesh&output=embed"
                  className="h-64 w-full"
                  loading="lazy"
                />
              </div>
            </aside>

            <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
              <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">Send a message</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Name</span>
                  <input className="field" value={form.name} onChange={(event) => update('name', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Mobile</span>
                  <input className="field" value={form.mobile} onChange={(event) => update('mobile', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Email</span>
                  <input className="field" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Service interested in</span>
                  <select className="field" value={form.service} onChange={(event) => update('service', event.target.value)}>
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Message</span>
                  <textarea className="field min-h-32" value={form.message} onChange={(event) => update('message', event.target.value)} />
                </label>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary mt-5">
                <Send size={17} /> {submitting ? 'Sending...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
