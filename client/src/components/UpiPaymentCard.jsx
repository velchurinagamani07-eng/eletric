import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { QRCodeCanvas } from 'qrcode.react'
import { SiGooglepay, SiPaytm, SiPhonepe } from 'react-icons/si'
import { CheckCircle2, ClipboardCopy, Download, Landmark, QrCode, UploadCloud } from 'lucide-react'
import ImageUploader from './ImageUploader'
import { settings } from '../data/catalog'
import { currency } from '../utils/format'
import { buildUpiPaymentUri, UPI_ID } from '../utils/upiPayment'

const paymentApps = [
  { name: 'Google Pay', Icon: SiGooglepay, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'PhonePe', Icon: SiPhonepe, color: 'text-purple-700', bg: 'bg-purple-50' },
  { name: 'Paytm', Icon: SiPaytm, color: 'text-sky-600', bg: 'bg-sky-50' },
  { name: 'BHIM UPI', Icon: BhimMark, color: 'text-orange-600', bg: 'bg-orange-50' },
]

export default function UpiPaymentCard({
  booking,
  utrNumber,
  screenshotURL,
  submitting = false,
  onUtrChange,
  onScreenshotUpload,
  onSubmit,
}) {
  const bookingId = booking?.bookingId || booking?.id
  const customerName = booking?.customer || booking?.customerName || 'Customer'
  const amount = Number(booking?.totalAmount ?? booking?.amount ?? 0)
  const upiUri = useMemo(
    () => buildUpiPaymentUri({ amount, bookingId, customerName, payeeName: settings.companyName }),
    [amount, bookingId, customerName],
  )
  const qrId = `upi-qr-${bookingId || 'booking'}`

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      toast.success('UPI ID copied.')
    } catch {
      toast.error('Could not copy UPI ID.')
    }
  }

  const downloadQr = () => {
    const canvas = document.getElementById(qrId)
    if (!canvas) {
      toast.error('QR code is still loading.')
      return
    }

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `upi-qr-${bookingId || 'payment'}.png`
    link.click()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-gray-950">
      <div className="grid gap-6 bg-[#0F172A] p-5 text-white lg:grid-cols-[1fr_auto] lg:items-center sm:p-7">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-200">
            <Landmark size={15} /> Direct UPI Payment
          </p>
          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">Pay securely with any UPI app</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Complete the transfer manually, then upload the payment screenshot and UTR number for admin verification.
          </p>
        </div>
        <div className="rounded-lg bg-white/10 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Amount</p>
          <p className="mt-1 text-3xl font-black text-amber-300">{currency(amount)}</p>
        </div>
      </div>

      <div className="grid gap-7 p-5 lg:grid-cols-[minmax(0,1fr)_340px] sm:p-7">
        <section className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Booking ID', bookingId],
              ['Customer Name', customerName],
              ['Amount', currency(amount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-1 break-words font-extrabold text-gray-950 dark:text-white">{value || '-'}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-black text-gray-950 dark:text-white">Accepted UPI apps</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {paymentApps.map(({ name, Icon, color, bg }) => (
                <div key={name} className={`flex items-center gap-3 rounded-lg border border-gray-100 p-3 ${bg} dark:border-white/10 dark:bg-white/5`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-lg bg-white ${color}`}>
                    <Icon size={25} />
                  </span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-200">UPI ID</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all font-mono text-lg font-black text-gray-950 dark:text-white">{UPI_ID}</p>
              <button type="button" className="btn-secondary shrink-0" onClick={copyUpi}>
                <ClipboardCopy size={17} /> Copy UPI
              </button>
            </div>
          </div>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit?.()
            }}
          >
            <label>
              <span className="mb-2 block text-sm font-black text-gray-800 dark:text-gray-100">Transaction ID / UTR Number</span>
              <input
                className="field"
                value={utrNumber}
                onChange={(event) => onUtrChange?.(event.target.value)}
                placeholder="Enter UPI transaction reference"
              />
            </label>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-gray-800 dark:text-gray-100">
                <UploadCloud size={17} /> Payment Screenshot
              </div>
              <ImageUploader
                label="Upload payment screenshot"
                aspectRatio="4 / 3"
                currentImageUrl={screenshotURL}
                folder={`upi-payment-${bookingId || 'booking'}`}
                maxSizeMB={5}
                onUploadComplete={onScreenshotUpload}
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center sm:w-fit" disabled={submitting}>
              <CheckCircle2 size={17} /> {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        </section>

        <aside className="text-center">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="mx-auto grid w-fit place-items-center rounded-lg border border-gray-100 bg-white p-4">
              <QRCodeCanvas id={qrId} value={upiUri} size={260} includeMargin />
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-black text-gray-950 dark:text-white">
              <QrCode size={17} /> Scan to Pay
            </p>
            <p className="mt-1 text-xs font-semibold text-gray-500">UPI QR for {currency(amount)}</p>
            <button type="button" className="btn-secondary mt-4 w-full justify-center" onClick={downloadQr}>
              <Download size={17} /> Download QR
            </button>
          </div>
          <p className="mt-4 text-xs font-semibold leading-6 text-gray-500">
            Keep the UTR number visible in your screenshot. Admin approval confirms the booking.
          </p>
        </aside>
      </div>
    </div>
  )
}

function BhimMark({ size = 25 }) {
  return (
    <span
      className="inline-grid place-items-center rounded-md bg-orange-600 px-1.5 py-1 text-[10px] font-black leading-none text-white"
      style={{ minWidth: size, minHeight: size }}
    >
      BHIM
    </span>
  )
}
