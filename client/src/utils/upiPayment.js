export const UPI_ID = import.meta.env.VITE_UPI_ID || 'dileepmanepalli14@okhdfcbank'
export const PAYMENT_METHOD = 'UPI'

export function buildUpiPaymentUri({
  upiId,
  amount,
  bookingId,
  customerName,
  payeeName = 'DP Home Electric Services',
}) {
  const targetUpiId = (upiId || UPI_ID || 'dileepmanepalli14@okhdfcbank').trim()
  const params = new URLSearchParams({
    pa: targetUpiId,
    pn: payeeName || 'DP Home Electric Services',
    cu: 'INR',
    tn: `Booking ${bookingId || ''}${customerName ? ` - ${customerName}` : ''}`.trim(),
  })

  const paymentAmount = Number(amount || 0)
  if (Number.isFinite(paymentAmount) && paymentAmount > 0) {
    params.set('am', paymentAmount.toFixed(2))
  }

  return `upi://pay?${params.toString()}`
}

export function buildAppSpecificUpiUri(app, options) {
  const base = buildUpiPaymentUri(options)
  const qs = base.replace(/^upi:\/\/pay\?/, '')
  switch (app) {
    case 'phonepe':
      return `phonepe://pay?${qs}`
    case 'gpay':
      return `tez://upi/pay?${qs}`
    case 'paytm':
      return `paytmmp://pay?${qs}`
    case 'bhim':
      return `upi://pay?${qs}`
    default:
      return base
  }
}

export function paymentStatusLabel(status) {
  const labels = {
    awaiting_payment: 'Awaiting UPI Payment',
    pending: 'Pending',
    pending_verification: 'Pending Verification',
    paid: 'Paid',
    success: 'Paid',
    rejected: 'Rejected',
    failed: 'Failed',
  }

  return labels[status] || String(status || 'pending').replace(/_/g, ' ')
}

export function isPaidStatus(status) {
  return ['paid', 'success'].includes(status)
}
