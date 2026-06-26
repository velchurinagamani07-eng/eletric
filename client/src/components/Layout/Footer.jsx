import { Link } from 'react-router-dom'
import { Globe2, Mail, MapPin, Phone, Send, Share2 } from 'lucide-react'
import { settings } from '../../data/catalog'

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-gray-200 bg-white pb-24 pt-12 dark:border-white/10 dark:bg-gray-950 lg:pb-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative shrink-0">
              <img
                src="/logo.webp"
                alt="DP Home Electric Services"
                className="h-11 w-11 rounded-xl object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                  event.currentTarget.nextSibling.style.display = 'flex'
                }}
              />
              <span
                style={{ display: 'none' }}
                className="h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-sm font-extrabold text-white"
              >
                DP
              </span>
            </span>
            <div>
              <p className="font-extrabold text-gray-950 dark:text-white">{settings.companyName}</p>
              <p className="text-sm text-gray-500">{settings.tagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-300">
            Licensed home electricians for fans, wiring, sockets, MCB, lighting, inverter wiring and emergency
            repairs with transparent pricing and a 3 months service warranty on eligible work.
          </p>
          <p className="mt-5 text-sm font-semibold text-gray-800 dark:text-gray-100">{settings.footerCredit}</p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950 dark:text-white">Quick Links</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <Link className="text-gray-600 hover:text-amber-600 dark:text-gray-300" to="/services">
              Services
            </Link>
            <Link className="text-gray-600 hover:text-amber-600 dark:text-gray-300" to="/booking">
              Book Now
            </Link>
            <Link className="text-gray-600 hover:text-amber-600 dark:text-gray-300" to="/contact">
              Contact
            </Link>
            <a className="text-gray-600 hover:text-amber-600 dark:text-gray-300" href="https://wa.me/919642908090" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950 dark:text-white">Contact</h2>
          <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300">
            <a className="flex items-center gap-2 hover:text-amber-600" href={`tel:${settings.phone}`}>
              <Phone size={16} /> {settings.phone}
            </a>
            <a className="flex items-center gap-2 hover:text-amber-600" href={`mailto:${settings.email}`}>
              <Mail size={16} /> {settings.email}
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={16} /> {settings.address}
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            {[
              { id: 'website', Icon: Globe2 },
              { id: 'share', Icon: Share2 },
              { id: 'send', Icon: Send },
            ].map(({ id, Icon }) => (
              <button
                type="button"
                key={id}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:text-gray-300"
                aria-label="Social link"
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
