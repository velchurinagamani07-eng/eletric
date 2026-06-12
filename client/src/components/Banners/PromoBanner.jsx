import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function PromoBanner() {
  return (
    <section className="bg-gray-950 py-3 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-sm font-semibold sm:flex-row sm:px-6 sm:text-left">
        <span className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={18} />
          3-month warranty on all completed electrical repairs.
        </span>
        <Link to="/booking" className="text-amber-300 hover:text-amber-200">
          Book a verified professional
        </Link>
      </div>
    </section>
  )
}

