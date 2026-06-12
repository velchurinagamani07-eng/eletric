export const UPI_ID = import.meta.env.VITE_UPI_ID || 'dileepmanepalli14@okhdfcbank'
export const PAYMENT_METHOD = 'UPI'

export function buildUpiPaymentUri({
  amount,
  bookingId,
  customerName,
  payeeName = 'Home Electric Services',
}) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: payeeName,
    cu: 'INR',
    tn: `Booking ${bookingId || ''}${customerName ? ` - ${customerName}` : ''}`.trim(),
  })

  const paymentAmount = Number(amount || 0)
  if (Number.isFinite(paymentAmount) && paymentAmount > 0) {
    params.set('am', paymentAmount.toFixed(2))
  }

  return `upi://pay?${params.toString()}`
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
