import { Phone } from 'lucide-react'
import { settings } from '../../data/catalog'

export default function CallButton() {
  return (
    <a
      href={`tel:+91${settings.phone}`}
      className="group fixed bottom-36 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:scale-105 lg:bottom-32"
      aria-label="Call Home Electric Services"
    >
      <span className="absolute right-14 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white group-hover:block">
        +91 {settings.phone}
      </span>
      <Phone size={21} />
    </a>
  )
}
