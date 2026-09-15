import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { BadgePercent, Bot, MessageSquare, Phone, Send, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { settings } from '../../data/catalog'
import { db, isFirebaseConfigured } from '../../firebase/config'
import { useAuthStore } from '../../store/authStore'

const quickLinks = [
  {
    id: 'book',
    label: 'Book Service',
    sublabel: 'Repairs & install',
    icon: Wrench,
    to: '/services',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
  },
  {
    id: 'call',
    label: 'Call Us Now',
    sublabel: '+91 ' + settings.phone,
    icon: Phone,
    href: `tel:+91${settings.phone}`,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    sublabel: 'Instant chat',
    icon: MessageSquare,
    href: `https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent('Hello, I need electrical service')}`,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-500/20',
  },
  {
    id: 'quote',
    label: 'Get a Quote',
    sublabel: 'Free estimate',
    icon: Sparkles,
    quote: true,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-500/20',
  },
  {
    id: 'warranty',
    label: 'Warranty',
    sublabel: '1 Mo guarantee',
    icon: ShieldCheck,
    to: '/about',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
  },
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
    navigate(link.to)
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
        className="chatbot-glow group fixed bottom-[17rem] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-xl transition hover:scale-105 lg:bottom-64"
        aria-label="Open HEBot"
      >
        <span className="absolute right-16 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-semibold text-white shadow-md group-hover:block">
          Need Help? Chat with HEBot
        </span>
        <Bot size={26} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#121212] lg:bottom-6"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white shadow-md">
                  <Bot size={22} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">HEBot Assistant</h2>
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">Online</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">How can we help you today?</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close HEBot"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              {quickLinks.map(({ icon: Icon, color, bgColor, ...link }) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => runAction({ icon: Icon, ...link })}
                  className="group flex items-center gap-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-2.5 text-left transition-all hover:border-amber-500/80 hover:bg-amber-50/60 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-amber-500/60 dark:hover:bg-zinc-800"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${bgColor} ${color} transition-transform group-hover:scale-105`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                      {link.label}
                    </p>
                    <p className="truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      {link.sublabel}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Quote Form */}
            <AnimatePresence>
              {quoteOpen && (
                <motion.form
                  onSubmit={submitQuote}
                  className="mt-3.5 grid gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-3 dark:border-zinc-800 dark:bg-zinc-900/90"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Request a Fast Price Estimate</p>
                  <input
                    className="field text-xs text-zinc-900 dark:text-white"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                  <input
                    className="field text-xs text-zinc-900 dark:text-white"
                    placeholder="Mobile Number"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    required
                  />
                  <textarea
                    className="field min-h-16 text-xs text-zinc-900 dark:text-white resize-none"
                    placeholder="Describe electrical work needed..."
                    value={form.requirement}
                    onChange={(event) => setForm((current) => ({ ...current, requirement: event.target.value }))}
                    required
                  />
                  <button type="submit" className="btn-primary min-h-9 text-xs justify-center" disabled={saving}>
                    <Send size={14} /> {saving ? 'Sending...' : 'Send Request'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer Trust Note */}
            <div className="mt-3.5 flex items-center gap-1.5 border-t border-zinc-100 pt-2.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <BadgePercent size={13} className="text-amber-600 shrink-0" />
              <span>Urgent repairs, licensed electricians & WhatsApp support.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
