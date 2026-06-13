import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { CheckCircle2, Download, Eye, FileText, Search, XCircle } from 'lucide-react'
import { db, isFirebaseConfigured } from '../firebase/config'
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'
import { currency, fullAddress } from '../utils/format'
import { generatePaymentVerificationsPDF } from '../utils/generatePDF'
import { paymentStatusLabel } from '../utils/upiPayment'

const statusClasses = {
  pending_verification: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function ManagePayments() {
  const { items: payments, setItems: setPayments, loading, error } = useFirestoreCollection('payments', [], 'createdAt')
  const { items: bookings } = useFirestoreCollection('bookings', [], 'createdAt')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState(null)
  const [busyId, setBusyId] = useState('')

  const bookingMap = useMemo(
    () => new Map(bookings.map((booking) => [booking.bookingId || booking.id, booking])),
    [bookings],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return payments
      .map((payment) => ({ ...payment, booking: bookingMap.get(payment.bookingId) }))
      .filter((payment) => {
        const statusMatch = status === 'all' || payment.paymentStatus === status
        if (!needle) return statusMatch
        const text = [
          payment.bookingId,
          payment.customerName,
          payment.paymentId || payment.id,
          payment.booking?.mobile,
          payment.booking?.serviceName,
        ].join(' ').toLowerCase()
        return statusMatch && text.includes(needle)
      })
  }, [bookingMap, payments, query, status])

  const notifyCustomer = async ({ payment, title, body, type }) => {
    if (!db || !isFirebaseConfigured || !payment?.userId) return
    await addDoc(collection(db, 'notifications'), {
      userId: payment.userId,
      role: 'user',
      title,
      body,
      type,
      bookingId: payment.bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    }).catch(() => {})
  }

  const approvePayment = async (payment) => {
    const booking = bookingMap.get(payment.bookingId)
    if (!db || !isFirebaseConfigured) {
      toast.error('Database is not configured.')
      return
    }

    setBusyId(payment.id)
    try {
      const approvedAt = serverTimestamp()
      await updateDoc(doc(db, 'payments', payment.id), {
        paymentStatus: 'paid',
        approvedAt,
        verifiedAt: approvedAt,
        updatedAt: approvedAt,
      })
      if (booking?.id || payment.bookingId) {
        await updateDoc(doc(db, 'bookings', booking?.id || payment.bookingId), {
          status: 'confirmed',
          bookingStatus: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod: 'UPI',
          paymentId: payment.id,
          screenshotURL: payment.screenshotURL,
          paidAt: approvedAt,
          updatedAt: approvedAt,
        })
      }
      await notifyCustomer({
        payment,
        title: 'Payment approved',
        body: `Your UPI payment for booking ${payment.bookingId} is approved. Receipt is ready.`,
        type: 'payment_approved',
      })
      setPayments((items) => items.map((item) => (item.id === payment.id ? { ...item, paymentStatus: 'paid' } : item)))
      toast.success('Payment approved and booking confirmed.')
    } catch (err) {
      toast.error(err.message || 'Unable to approve payment.')
    } finally {
      setBusyId('')
    }
  }

  const rejectPayment = async (payment) => {
    const reason = window.prompt('Reason for rejecting this payment?')
    if (!reason) return
    const booking = bookingMap.get(payment.bookingId)
    setBusyId(payment.id)
    try {
      const rejectedAt = serverTimestamp()
      await updateDoc(doc(db, 'payments', payment.id), {
        paymentStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt,
        updatedAt: rejectedAt,
      })
      if (booking?.id || payment.bookingId) {
        await updateDoc(doc(db, 'bookings', booking?.id || payment.bookingId), {
          paymentStatus: 'rejected',
          paymentRejectionReason: reason,
          updatedAt: rejectedAt,
        })
      }
      await notifyCustomer({
        payment,
        title: 'Payment rejected',
        body: `Your payment proof for booking ${payment.bookingId} was rejected. Reason: ${reason}`,
        type: 'payment_rejected',
      })
      setPayments((items) => items.map((item) => (item.id === payment.id ? { ...item, paymentStatus: 'rejected', rejectionReason: reason } : item)))
      toast.success('Payment rejected.')
    } catch (err) {
      toast.error(err.message || 'Unable to reject payment.')
    } finally {
      setBusyId('')
    }
  }

  const exportCsv = () => {
    const headers = ['Booking ID', 'Customer', 'Amount', 'Reference', 'Status', 'Service']
    const csvRows = rows.map((payment) => [
      payment.bookingId,
      payment.customerName,
      payment.amount,
      payment.paymentId || payment.id,
      payment.paymentStatus,
      payment.booking?.serviceName || '',
    ])
    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = 'payment-verifications.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-bold text-gray-950 dark:text-white">Payment Records</h2>
          <p className="mt-1 text-sm text-gray-500">View UPI screenshots and payment references for booking records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input className="field w-60 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, booking, customer" />
          </div>
          <select className="field w-48" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending_verification">Legacy Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="button" className="btn-secondary" onClick={exportCsv}>
            <Download size={17} /> CSV
          </button>
          <button type="button" className="btn-secondary" onClick={() => generatePaymentVerificationsPDF(rows)}>
            <FileText size={17} /> PDF
          </button>
        </div>
      </div>

      {error && <p className="m-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Payment</th>
              <th>Booking</th>
              <th>Customer</th>
              <th>Reference</th>
              <th>Screenshot</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {loading ? (
              <tr><td className="px-4 py-8 text-center text-gray-500" colSpan="7">Loading payments...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-gray-500" colSpan="7">No payments found.</td></tr>
            ) : rows.map((payment) => (
              <tr key={payment.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-black text-gray-950 dark:text-white">{currency(payment.amount)}</p>
                  <p className="mt-1 text-xs text-gray-500">{payment.paymentMethod || 'UPI'}</p>
                </td>
                <td>
                  <p className="font-bold text-gray-950 dark:text-white">{payment.bookingId}</p>
                  <p className="mt-1 text-xs text-gray-500">{payment.booking?.serviceName || 'Booking details unavailable'}</p>
                </td>
                <td>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{payment.customerName || payment.booking?.customer || '-'}</p>
                  <p className="mt-1 max-w-xs text-xs text-gray-500">{fullAddress(payment.booking?.address)}</p>
                </td>
                <td className="font-mono font-bold text-gray-800 dark:text-gray-100">{payment.paymentId || payment.id}</td>
                <td>
                  {payment.screenshotURL ? (
                    <button type="button" className="btn-secondary px-3 py-2" onClick={() => setPreview(payment)}>
                      <Eye size={16} /> View
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-red-500">Missing</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${statusClasses[payment.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {paymentStatusLabel(payment.paymentStatus)}
                  </span>
                  {payment.rejectionReason && <p className="mt-2 max-w-xs text-xs font-semibold text-red-600">{payment.rejectionReason}</p>}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary px-3 py-2"
                      disabled={busyId === payment.id || payment.paymentStatus === 'paid'}
                      onClick={() => approvePayment(payment)}
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={busyId === payment.id || payment.paymentStatus === 'rejected'}
                      onClick={() => rejectPayment(payment)}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-gray-950/75 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-950" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/10">
              <div>
                <p className="font-black text-gray-950 dark:text-white">{preview.bookingId}</p>
                <p className="text-sm text-gray-500">Reference: {preview.paymentId || preview.id}</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setPreview(null)}>Close</button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-gray-100 p-4 dark:bg-gray-900">
              <img src={preview.screenshotURL} alt={`Payment screenshot for ${preview.bookingId}`} className="mx-auto max-h-[70vh] rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
