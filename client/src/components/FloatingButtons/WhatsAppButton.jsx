import { MessageCircle } from 'lucide-react'
import { settings } from '../../data/catalog'

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent('Hello, I need electrical help')}`}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-52 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 lg:bottom-48"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute right-16 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white group-hover:block">
        WhatsApp
      </span>
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
      <MessageCircle className="relative" size={22} />
    </a>
  )
}
