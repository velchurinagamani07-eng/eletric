import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PhoneCall, ShieldAlert } from 'lucide-react'
import { settings } from '../data/catalog'

export default function AccountSuspended() {
  return (
    <>
      <Helmet>
        <title>Account Suspended | Home Electric Services</title>
      </Helmet>
      <main className="grid min-h-screen place-items-center bg-[#FAFAFA] px-4 py-10 dark:bg-gray-950">
        <section className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-7 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-gray-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert size={28} />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-[#0F172A] dark:text-white">Account access paused</h1>
          <p className="mt-3 text-sm leading-7 text-[#475569] dark:text-gray-300">
            This profile is inactive or suspended. Please contact Home Electric Services support to review access.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={`tel:+91${settings.phone}`} className="btn-primary">
              <PhoneCall size={17} /> Call Support
            </a>
            <Link to="/" className="btn-secondary">Back Home</Link>
          </div>
        </section>
      </main>
    </>
  )
}
