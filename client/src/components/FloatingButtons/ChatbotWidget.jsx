import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { BadgePercent, Bot, CalendarSearch, MessageSquare, Phone, Send, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { settings } from '../../data/catalog'
import { db, isFirebaseConfigured } from '../../firebase/config'
import { useAuthStore } from '../../store/authStore'

const quickLinks = [
  { id: 'book', label: 'Book', icon: Wrench, to: '/services' },
  { id: 'track', label: 'Track', icon: CalendarSearch, to: '/dashboard/bookings', auth: true },
  { id: 'call', label: 'Call', icon: Phone, href: `tel:+91${settings.phone}` },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, href: `https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent('Hello, I need electrical service')}` },
  { id: 'quote', label: 'Quote', icon: Sparkles, quote: true },
  { id: 'warranty', label: 'Warranty', icon: ShieldCheck, to: '/about' },
]

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', requirement: '' })
  const [saving, setSaving] = useState(false)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const runAction = (link) => {
    if (link.quote) {
      setQuoteOpen((value) => !value)
      return
    }
    if (link.href) {
      if (link.href.startsWith('tel:')) window.location.assign(link.href)
      else window.open(link.href, '_blank', 'noopener,noreferrer')
      return
    }
    if (link.auth && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(link.to)}`)
    } else {
      navigate(link.to)
    }
    setOpen(false)
  }

  const submitQuote = async (event) => {
    event.preventDefault()
    if (!form.name || !form.phone || !form.requirement) {
      toast.error('Complete the quote form.')
      return
    }
    setSaving(true)
    try {
      if (db && isFirebaseConfigured) {
        const lead = await addDoc(collection(db, 'chatbot_leads'), {
          ...form,
          userId: user?.uid || '',
          status: 'new',
          createdAt: serverTimestamp(),
        })
        await addDoc(collection(db, 'notifications'), {
          userId: 'admin',
          role: 'admin',
          title: 'New chatbot quote lead',
          body: `${form.name} requested: ${form.requirement}`,
          leadId: lead.id,
          isRead: false,
          createdAt: serverTimestamp(),
        }).catch(() => {})
      }
      setForm({ name: '', phone: '', requirement: '' })
      setQuoteOpen(false)
      toast.success('Quote request sent. We will call you soon.')
    } catch (error) {
      toast.error(error.message || 'Unable to send quote request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="chatbot-glow group fixed bottom-[17rem] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition hover:scale-105 lg:bottom-64"
        aria-label="Open HEBot"
      >
        <span className="absolute right-16 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white group-hover:block">
          HEBot
        </span>
        <Bot size={24} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-surface-border bg-white p-4 shadow-2xl lg:bottom-6"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">HEBot</p>
                <h2 className="font-display text-lg font-extrabold text-navy">Quick help</h2>
              </div>
              <button type="button" className="btn-ghost p-2" onClick={() => setOpen(false)} aria-label="Close HEBot">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickLinks.map(({ icon: Icon, ...link }) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => runAction({ icon: Icon, ...link })}
                  className="flex min-h-12 items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 text-left text-sm font-bold text-navy transition hover:border-primary hover:bg-primary-light"
                >
                  <Icon className="text-primary" size={17} /> {link.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {quoteOpen && (
                <motion.form
                  onSubmit={submitQuote}
                  className="mt-4 grid gap-3 rounded-2xl border border-surface-border bg-surface p-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input className="field" placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                  <input className="field" placeholder="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                  <textarea className="field min-h-20" placeholder="What do you need?" value={form.requirement} onChange={(event) => setForm((current) => ({ ...current, requirement: event.target.value }))} />
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Send size={16} /> {saving ? 'Sending...' : 'Send Quote'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-gray-400">
              <BadgePercent size={13} /> Complete a paid booking to earn a Rs. 50 coupon.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
