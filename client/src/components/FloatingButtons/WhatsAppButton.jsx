import { MessageCircle } from 'lucide-react'
import { settings } from '../../data/catalog'

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent('Hello, I need electrical help')}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-52 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:scale-105 lg:bottom-48"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-30" />
      <MessageCircle className="relative" size={22} />
    </a>
  )
}
