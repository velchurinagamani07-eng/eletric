import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import {
  BadgePercent,
  Bot,
  CalendarSearch,
  Headphones,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { settings } from '../../data/catalog'
import { db, isFirebaseConfigured } from '../../firebase/config'
import { useServiceCategories, useServices } from '../../hooks/useServices'
import { useAuthStore } from '../../store/authStore'

const quickReplies = [
  { id: 'book', label: 'Book a Service', icon: Wrench },
  { id: 'track', label: 'Track My Booking', icon: CalendarSearch },
  { id: 'quote', label: 'Get a Quote', icon: Sparkles },
  { id: 'emergency', label: 'Emergency Help', icon: Phone },
  { id: 'services', label: 'View All Services', icon: Wrench },
  { id: 'offers', label: 'Check Our Offers', icon: BadgePercent },
  { id: 'warranty', label: 'About Warranty', icon: ShieldCheck },
  { id: 'human', label: 'Talk to Human', icon: Headphones },
]

const actionIcons = {
  book: Wrench,
  track: CalendarSearch,
  quote: Sparkles,
  emergency: Phone,
  services: Wrench,
  offers: BadgePercent,
  warranty: ShieldCheck,
  human: Headphones,
  login: UserRound,
  whatsapp: MessageSquare,
  call: Phone,
}

const timestamp = () =>
  new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date())

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const [quoteStep, setQuoteStep] = useState(null)
  const [quoteData, setQuoteData] = useState({ name: '', phone: '', requirement: '' })
  const [messages, setMessages] = useState([])
  const user = useAuthStore((state) => state.user)
  const { services } = useServices({ onlyActive: true })
  const { categories } = useServiceCategories({ includeAll: false })
  const navigate = useNavigate()
  const bodyRef = useRef(null)

  const categoryActions = useMemo(
    () =>
      categories
        .filter((category) => category.id !== 'all' && category.isActive)
        .slice(0, 8)
        .map((category) => ({
          id: `category-${category.id}`,
          label: category.name,
          to: `/services?category=${category.id}`,
          icon: Zap,
        })),
    [categories],
  )

  const addBot = useCallback((text, actions = []) => {
    setMessages((items) => [...items, { id: `${Date.now()}-bot`, role: 'bot', text, actions, time: timestamp() }])
  }, [])

  const addUser = useCallback((text) => {
    setMessages((items) => [...items, { id: `${Date.now()}-user`, role: 'user', text, time: timestamp() }])
  }, [])

  useEffect(() => {
    if (!open || greeted) return undefined
    const typingTimer = window.setTimeout(() => setIsTyping(true), 0)
    const timer = window.setTimeout(() => {
      addBot("Hi! I'm HEBot, your electrical service assistant. How can I help you today?", quickReplies)
      setIsTyping(false)
      setGreeted(true)
    }, 1000)
    return () => {
      window.clearTimeout(typingTimer)
      window.clearTimeout(timer)
    }
  }, [addBot, open, greeted])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping, open])

  const botAfterDelay = (callback, delay = 900) => {
    setIsTyping(true)
    window.setTimeout(() => {
      callback()
      setIsTyping(false)
    }, delay)
  }

  const saveQuoteLead = async (lead) => {
    if (!db || !isFirebaseConfigured) return
    const saved = await addDoc(collection(db, 'chatbot_leads'), {
      ...lead,
      userId: user?.uid || '',
      status: 'new',
      createdAt: serverTimestamp(),
    })
    await addDoc(collection(db, 'notifications'), {
      userId: 'admin',
      role: 'admin',
      title: 'New chatbot quote lead',
      body: `${lead.name} requested: ${lead.requirement}`,
      leadId: saved.id,
      isRead: false,
      createdAt: serverTimestamp(),
    })
  }

  const handleQuoteMessage = async (text) => {
    if (quoteStep === 'name') {
      setQuoteData((current) => ({ ...current, name: text }))
      setQuoteStep('phone')
      botAfterDelay(() => addBot('Please share your phone number.'))
      return
    }

    if (quoteStep === 'phone') {
      setQuoteData((current) => ({ ...current, phone: text }))
      setQuoteStep('requirement')
      botAfterDelay(() => addBot('What electrical service do you need?'))
      return
    }

    const lead = { ...quoteData, requirement: text }
    setQuoteData({ name: '', phone: '', requirement: '' })
    setQuoteStep(null)
    botAfterDelay(async () => {
      try {
        await saveQuoteLead(lead)
      } catch (error) {
        if (import.meta.env.DEV) console.error(error)
      }
      addBot('Thanks, we will call you within 30 minutes. You can also reach us instantly on WhatsApp.', [
        { id: 'whatsapp', label: 'WhatsApp Now', href: `https://wa.me/91${settings.whatsapp}` },
      ])
    }, 1000)
  }

  const respondToText = (text) => {
    const lower = text.toLowerCase()
    botAfterDelay(() => {
      if (/(fan|light|ac|wiring|socket|mcb|inverter)/i.test(lower)) {
        const relevant = services
          .filter((service) => lower.includes(service.category) || lower.includes(service.name.toLowerCase().split(' ')[0]))
          .slice(0, 4)
          .map((service) => ({ id: service.id, label: service.name, to: `/services/${service.slug || service.id}` }))
        addBot('These services may help. You can open one or book from the service page.', relevant.length ? relevant : categoryActions)
        return
      }

      if (/(price|cost|rate|charge)/i.test(lower)) {
        addBot('Most services start from Rs. 149. Final pricing depends on work type, parts, and site condition.', [
          { id: 'services', label: 'View Services', to: '/services' },
          { id: 'quote', label: 'Get Quote', action: 'quote' },
        ])
        return
      }

      if (/warranty/i.test(lower)) {
        addBot('Home Electric Services includes a 3 month workmanship warranty on completed service work. Keep your receipt for warranty support.', [
          { id: 'track', label: 'My Bookings', to: '/customer/bookings' },
        ])
        return
      }

      if (/(cancel|reschedule)/i.test(lower)) {
        addBot('You can manage pending bookings from your customer account.', [
          { id: 'track', label: 'Open My Bookings', to: '/customer/bookings' },
          { id: 'human', label: 'Talk to Human', action: 'human' },
        ])
        return
      }

      addBot('I can help with bookings, tracking, quotes, emergency support, offers, and warranty questions.', quickReplies)
    }, 1500)
  }

  const sendMessage = async (text = message) => {
    const trimmed = text.trim()
    if (!trimmed) return
    addUser(trimmed)
    setMessage('')

    if (quoteStep) {
      await handleQuoteMessage(trimmed)
      return
    }

    respondToText(trimmed)
  }

  const executeAction = (action) => {
    if (action.href) {
      if (action.href.startsWith('tel:')) window.location.assign(action.href)
      else window.open(action.href, '_blank', 'noopener,noreferrer')
      return
    }

    if (action.to) {
      navigate(action.to)
      setOpen(false)
      return
    }

    if (action.action) {
      handleQuickReply(action.action, action.label)
      return
    }

    handleQuickReply(action.id, action.label)
  }

  const handleQuickReply = (id, label) => {
    addUser(label)

    if (id === 'book') {
      botAfterDelay(() => addBot('Great! Which service are you looking for?', categoryActions))
      return
    }

    if (id?.startsWith('category-')) {
      const categoryId = id.replace('category-', '')
      navigate(`/services?category=${categoryId}`)
      setOpen(false)
      return
    }

    if (id === 'track') {
      botAfterDelay(() => {
        if (user) {
          addBot('You can track assigned worker, status, photos, and receipts from My Bookings.', [
            { id: 'track', label: 'Open My Bookings', to: '/customer/bookings' },
          ])
        } else {
          addBot('Please log in to track your booking.', [{ id: 'login', label: 'Login', to: '/login' }])
        }
      })
      return
    }

    if (id === 'quote') {
      setQuoteStep('name')
      botAfterDelay(() => addBot('Sure. What is your name?'))
      return
    }

    if (id === 'emergency') {
      botAfterDelay(() => addBot(`Emergency help is available at +91 ${settings.phone}.`, [
        { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/91${settings.whatsapp}` },
        { id: 'call', label: `Call +91 ${settings.phone}`, href: `tel:+91${settings.phone}` },
      ]))
      return
    }

    if (id === 'services') {
      navigate('/services')
      setOpen(false)
      return
    }

    if (id === 'offers') {
      navigate('/customer/coupons')
      setOpen(false)
      return
    }

    if (id === 'warranty') {
      botAfterDelay(() => addBot('Every completed job includes a 3 month workmanship warranty. Your receipt shows booking, payment, service, and warranty details.', [
        { id: 'track', label: 'View Receipts', to: '/customer/bookings' },
      ]))
      return
    }

    if (id === 'human') {
      botAfterDelay(() => addBot('You can reach the team instantly here.', [
        { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/91${settings.whatsapp}` },
        { id: 'call', label: `Call +91 ${settings.phone}`, href: `tel:+91${settings.phone}` },
      ]))
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="chatbot-glow fixed bottom-[17rem] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-navy-900 shadow-xl transition hover:scale-105 lg:bottom-64"
        aria-label="Open HEBot"
      >
        <MessageSquare size={23} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white shadow-2xl dark:bg-gray-950 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[520px] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Zap className="animate-pulse" fill="currentColor" size={21} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">HEBot</p>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-white/85">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" /> Online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-gray-950">
              {messages.map((item) => (
                <motion.div
                  key={item.id}
                  className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, x: item.role === 'user' ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className={`max-w-[86%] ${item.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                        item.role === 'user'
                          ? 'bg-amber-500 text-gray-950'
                          : 'bg-white text-gray-700 dark:bg-white/10 dark:text-gray-100'
                      }`}
                    >
                      {item.role === 'bot' && <Bot className="mb-1 inline text-amber-600" size={15} />} {item.text}
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-gray-400">{item.time}</p>
                    {item.actions?.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-left">
                        {item.actions.map((action) => (
                          <ActionButton key={`${item.id}-${action.id}-${action.label}`} action={action} onClick={() => executeAction(action)} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div className="inline-flex items-center gap-1 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:240ms]" />
                </motion.div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendMessage()
                }}
              >
                <input
                  className="field"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={quoteStep ? 'Reply to continue quote' : 'Type your message'}
                />
                <button type="submit" className="btn-primary px-3" aria-label="Send message">
                  <Send size={17} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ActionButton({ action, onClick }) {
  const Icon = action.icon || actionIcons[action.id] || Zap

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 items-center gap-2 rounded-lg border border-amber-100 bg-white px-2.5 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
    >
      <Icon className="shrink-0 text-amber-600" size={15} />
      <span>{action.label}</span>
    </button>
  )
}
