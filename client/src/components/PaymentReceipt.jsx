import { Download, Mail, MessageCircle, Printer, ShieldCheck, Zap } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { settings } from '../data/catalog'
import { generateReceiptPDF } from '../utils/generatePDF'
import { currency, fullAddress } from '../utils/format'
import { UPI_ID, isPaidStatus, paymentStatusLabel } from '../utils/upiPayment'

const statusClasses = {
  paid: 'bg-emerald-100 text-emerald-700',
  success: 'bg-emerald-100 text-emerald-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-yellow-100 text-yellow-700',
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
}

export default function PaymentReceipt({ booking }) {
  if (!booking) return null

  const receiptUrl = typeof window !== 'undefined' ? window.location.href : `https://homeelectricservices.in/receipt/${booking.bookingId || booking.id}`
  const paymentStatus = booking.paymentStatus || booking.status || 'pending'
  const statusLabel = isPaidStatus(paymentStatus) ? 'PAID' : paymentStatusLabel(paymentStatus).toUpperCase()
  const issueDate = formatDate(booking.createdAt || new Date().toISOString())
  const paymentDate = isPaidStatus(paymentStatus) ? formatDate(booking.paidAt || booking.approvedAt || booking.paymentDate || booking.createdAt) : '-'
  const warrantyUntil = booking.date ? new Date(`${booking.date}T00:00:00`) : new Date()
  warrantyUntil.setMonth(warrantyUntil.getMonth() + 3)

  const whatsappText = encodeURIComponent(
    `Receipt ${booking.bookingId || booking.id}: ${booking.serviceName} - ${currency(booking.amount)}. ${receiptUrl}`,
  )

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="print-hidden sticky top-20 z-20 mb-4 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-gray-950/95">
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          <Printer size={17} /> Print
        </button>
        <button type="button" className="btn-primary" disabled={!isPaidStatus(paymentStatus)} onClick={() => generateReceiptPDF(booking)}>
          <Download size={17} /> Download PDF
        </button>
        <a className="btn-secondary" href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer">
          <MessageCircle size={17} /> Share on WhatsApp
        </a>
        <a className="btn-secondary" href={`mailto:?subject=DP Home Electric Services Receipt&body=${whatsappText}`}>
          <Mail size={17} /> Email Receipt
        </a>
      </div>

      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-gray-950">
        <header className="grid gap-5 bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18">
              <Zap fill="currentColor" size={30} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">{settings.companyName}</h1>
              <p className="mt-1 text-sm font-semibold text-white/80">Expert Electricians in Tuni, Andhra Pradesh</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/80">Service Receipt</p>
            <p className="mt-2 font-mono text-lg font-black">{booking.bookingId || booking.id}</p>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClasses[paymentStatus] || statusClasses.pending}`}>
              {statusLabel}
            </span>
          </div>
        </header>

        <section className="grid gap-4 bg-slate-50 p-5 sm:grid-cols-2">
          <InfoBlock
            rows={[
              ['Receipt Number', booking.bookingId || booking.id],
              ['Issue Date', issueDate],
              ['Due Date', booking.date || issueDate],
            ]}
          />
          <InfoBlock
            rows={[
              ['Payment Method', booking.paymentMethod || 'UPI'],
              ['Payment Reference', booking.paymentId || 'Paid by screenshot'],
              ['Payment Date', paymentDate],
              ['UPI ID', booking.upiId || UPI_ID],
            ]}
          />
        </section>

        <section className="grid gap-6 p-6 sm:grid-cols-2">
          <DetailPanel
            title="Customer Details"
            rows={[
              ['Name', booking.customer || booking.userName || 'Customer'],
              ['Phone', booking.mobile || '-'],
              ['Email', booking.email || '-'],
              ['Address', fullAddress(booking.address)],
            ]}
          />
          <DetailPanel
            title="Service Details"
            rows={[
              ['Worker', booking.workerName || 'To be assigned'],
              ['Scheduled', `${booking.date || '-'} | ${booking.timeSlot || '-'}`],
              ['Completed', booking.completedAt ? String(booking.completedAt).slice(0, 10) : '-'],
              ['Warranty Expiry', warrantyUntil.toISOString().slice(0, 10)],
            ]}
          />
        </section>

        <section className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-500 text-white">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white dark:bg-gray-950">
                  <td className="px-4 py-3 font-bold text-gray-950 dark:text-white">{booking.serviceName}</td>
                  <td>{booking.category || 'Electrical service'}</td>
                  <td>1</td>
                  <td>{currency(booking.amount + (booking.discountAmount || 0))}</td>
                  <td>{currency(booking.amount + (booking.discountAmount || 0))}</td>
                </tr>
                <SummaryRow label="Subtotal" value={currency(booking.amount + (booking.discountAmount || 0))} />
                <SummaryRow label="Coupon Discount" value={`-${currency(booking.discountAmount || 0)}`} tone="green" />
                <SummaryRow label="Wallet Credit" value={currency(0)} tone="green" />
                <SummaryRow label="GST 18 percent" value={currency(0)} />
                <tr className="bg-amber-50 text-lg font-black text-amber-700">
                  <td className="px-4 py-3 text-right" colSpan={4}>Total</td>
                  <td>{currency(booking.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 px-6 pb-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-amber-900">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} />
              <div>
                <h2 className="font-black">3 Months Warranty Included</h2>
                <p className="mt-1 text-sm font-semibold">Valid until {warrantyUntil.toISOString().slice(0, 10)}. Claim support: +91 {settings.phone}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-3">
              <QRCodeSVG value={receiptUrl} size={112} />
            </div>
            <p className="mt-2 text-xs font-semibold text-gray-500">Scan to verify</p>
            <p className="mt-1 text-[11px] font-semibold text-gray-400">QR reference: {booking.bookingId || booking.id}</p>
          </div>
        </section>

        <footer className="flex flex-col gap-2 bg-slate-100 px-6 py-4 text-xs font-semibold text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{settings.companyName} | homeelectricservices.in | +91 {settings.phone}</span>
          <span>{settings.gst || 'GST: Not available'} | Built by WayzenTech - 9398724704</span>
        </footer>
      </article>
    </section>
  )
}

function formatDate(value) {
  if (!value) return '-'
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10)
  if (typeof value.toMillis === 'function') return new Date(value.toMillis()).toISOString().slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? String(value).slice(0, 10) : new Date(parsed).toISOString().slice(0, 10)
}

function InfoBlock({ rows }) {
  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-1 font-bold text-gray-950">{value}</p>
        </div>
      ))}
    </div>
  )
}

function DetailPanel({ title, rows }) {
  return (
    <div>
      <h2 className="font-black text-gray-950 dark:text-white">{title}</h2>
      <div className="mt-3 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{value || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, tone = 'default' }) {
  return (
    <tr className="bg-slate-50 text-sm dark:bg-white/5">
      <td className={`px-4 py-3 text-right font-bold ${tone === 'green' ? 'text-emerald-700' : 'text-gray-700'}`} colSpan={4}>
        {label}
      </td>
      <td className={tone === 'green' ? 'font-bold text-emerald-700' : 'font-bold text-gray-950 dark:text-white'}>{value}</td>
    </tr>
  )
}
