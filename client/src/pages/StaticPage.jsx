import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { settings } from '../data/catalog'
import RecommendedServices from '../components/RecommendedServices'

const pageContent = {
  faq: {
    title: 'FAQ',
    heading: 'Frequently Asked Questions',
    description: 'Answers about booking, pricing, warranty, WhatsApp enquiries, and service visits.',
    items: [
      ['How soon can I book?', 'Same-day slots are available when a verified electrician is free in your area.'],
      ['Do services include warranty?', 'Completed workmanship includes a 3 months service warranty on eligible work. Parts follow supplier warranty.'],
      ['Can I reschedule?', 'Service visits can be rescheduled by contacting support on phone or WhatsApp.'],
      ['How is price calculated?', 'Base labor is shown upfront. Any parts or extra work are confirmed before completion.'],
    ],
  },
  blog: {
    title: 'Blog',
    heading: 'Electrical Safety Notes',
    description: 'Practical tips for safer homes, better maintenance, and timely repairs.',
    items: [
      ['When to replace a switchboard', 'Warm plates, sparks, loose switches, or burning smells need immediate inspection.'],
      ['Fan maintenance basics', 'Noise, wobble, and speed drop often point to capacitor, bearing, or mounting issues.'],
      ['MCB safety checks', 'Frequent trips can mean overload, leakage, or damaged wiring that needs diagnosis.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    heading: 'Privacy Policy',
    description: 'How DP Home Electric Services handles customer booking and contact information.',
    items: [
      ['Data we collect', 'Name, phone, address, enquiry details, payment references when applicable, and uploaded service photos.'],
      ['How we use data', 'To schedule services, assign workers, issue receipts when applicable, provide warranty, and support customers.'],
      ['Data access', 'Admin users manage service data. Workers only receive job details needed to complete assigned work.'],
    ],
  },
  terms: {
    title: 'Terms',
    heading: 'Terms of Service',
    description: 'Service terms for booking home electrical work in Tuni and nearby areas.',
    items: [
      ['Bookings', 'Bookings are confirmed after service, address, date, and contact details are provided.'],
      ['Payments', 'Payments may be collected as agreed after admin confirms the visit and estimate. Receipts are issued when applicable.'],
      ['Warranty', 'Warranty covers eligible workmanship for 3 months and excludes misuse, external damage, and unrelated faults.'],
    ],
  },
  success: {
    title: 'Request Sent',
    heading: 'Request Sent',
    description: 'Your service request has been received. DP Home Electric Services will confirm details by phone or WhatsApp.',
    items: [['Next step', 'Admin will review your request and assign a verified electrician when confirmed.']],
  },
  failed: {
    title: 'Request Help',
    heading: 'Need Help?',
    description: 'If a WhatsApp request did not open or send, contact support directly.',
    items: [['Need help?', `Call +91 ${settings.phone} or use WhatsApp support for service help.`]],
  },
}

export default function StaticPage({ type }) {
  const page = pageContent[type] || pageContent.faq
  const schema =
    type === 'faq'
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.items.map(([question, answer]) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer },
          })),
        }
      : null

  return (
    <>
      <Helmet>
        <title>{page.title} | DP Home Electric Services | Tuni, Andhra Pradesh</title>
        <meta name="description" content={page.description.slice(0, 158)} />
        {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
      </Helmet>
      <main className="min-h-screen bg-[#0A0A0A] py-10 text-white">
        <section className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-lg border border-red-900/30 bg-zinc-900 p-8 text-white shadow-xl">
            <p className="flex items-center gap-2 text-sm font-bold text-red-400">
              <Zap size={17} /> {settings.companyName}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">{page.heading}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">{page.description}</p>
          </div>
          <div className="mt-8 grid gap-4">
            {page.items.map(([title, text]) => (
              <article key={title} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
                <h2 className="flex items-center gap-2 font-bold text-white">
                  {type === 'success' ? <CheckCircle2 className="text-emerald-500" size={19} /> : <ShieldCheck className="text-red-500" size={19} />}
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-gray-300">{text}</p>
              </article>
            ))}
          </div>
          {type === 'success' && (
            <RecommendedServices
              title="You might need this too"
              subtitle="Get 10% off if booked within 7 days."
            />
          )}
          <Link to="/services" className="btn-primary mt-8">
            View Services <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    </>
  )
}
