import { apiJson } from './apiClient'

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'))
    document.body.appendChild(script)
  })

export async function createRazorpayOrder(bookingId) {
  return apiJson('/api/payments/create-order', {
    method: 'POST',
    body: { bookingId },
  })
}

export async function openRazorpayCheckout({ order, user, booking, onSuccess }) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!key) throw new Error('Razorpay key is not configured.')

  await loadRazorpayScript()

  const checkout = new window.Razorpay({
    key,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'Home Electric Services',
    description: booking.serviceName || 'Home electrical service',
    order_id: order.orderId,
    prefill: {
      name: user?.name,
      email: user?.email,
      contact: user?.mobile,
    },
    theme: { color: '#F59E0B' },
    handler: onSuccess,
  })

  checkout.open()
}
