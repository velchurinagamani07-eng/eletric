const express = require('express')
const crypto = require('crypto')
const Razorpay = require('razorpay')
const asyncHandler = require('../utils/asyncHandler')
const { db } = require('../services/firebaseAdmin')

const router = express.Router()

// Helper to load credentials dynamically from Firestore
async function getRazorpayInstance() {
  if (!db) {
    throw new Error('Database connection unavailable')
  }

  const [publicSnap, secretSnap] = await Promise.all([
    db.collection('settings').doc('payment_public').get(),
    db.collection('settings').doc('payment_secret').get(),
  ])

  if (!publicSnap.exists() || !secretSnap.exists()) {
    throw new Error('Payment gateway settings are not fully configured by Admin.')
  }

  const publicData = publicSnap.data()
  const secretData = secretSnap.data()

  const keyId = publicData.razorpayKeyId
  const keySecret = secretData.razorpayKeySecret

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are missing.')
  }

  const rzp = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return { rzp, keyId, keySecret, publicData }
}

// Route to create a new payment order
router.post(
  '/create-order',
  asyncHandler(async (req, res) => {
    const { amount } = req.body
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount is required and must be greater than zero.' })
    }

    try {
      const { rzp, keyId } = await getRazorpayInstance()
      
      const options = {
        amount: Math.round(Number(amount) * 100), // convert rupees to paise
        currency: 'INR',
        receipt: `order_rcpt_${Date.now()}`,
      }

      const order = await rzp.orders.create(options)
      return res.status(201).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpayKeyId: keyId,
      })
    } catch (error) {
      console.error('[Payments API] Error creating order:', error)
      return res.status(500).json({ message: error.message || 'Razorpay order creation failed.' })
    }
  }),
)

// Route to verify the Razorpay signature after payment
router.post(
  '/verify-signature',
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required Razorpay payment confirmation details.' })
    }

    try {
      const { keySecret } = await getRazorpayInstance()
      
      // Calculate HMAC-SHA256 signature
      const hmac = crypto.createHmac('sha256', keySecret)
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`)
      const generatedSignature = hmac.digest('hex')

      const isValid = generatedSignature === razorpay_signature

      if (isValid) {
        return res.status(200).json({
          status: 'success',
          verified: true,
          message: 'Payment signature verified successfully.',
        })
      } else {
        return res.status(400).json({
          status: 'failed',
          verified: false,
          message: 'Payment signature verification failed. Invalid response signature.',
        })
      }
    } catch (error) {
      console.error('[Payments API] Error verifying signature:', error)
      return res.status(500).json({ message: error.message || 'Razorpay signature verification failed.' })
    }
  }),
)

module.exports = router
