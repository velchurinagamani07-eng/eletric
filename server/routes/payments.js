const crypto = require('crypto')
const express = require('express')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const asyncHandler = require('../utils/asyncHandler')
const { hasRazorpayKeys, razorpay } = require('../services/razorpay')
const { db } = require('../services/firebaseAdmin')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

router.post(
  '/create-order',
  verifyFirebaseToken,
  body('bookingId').isString().trim().isLength({ min: 1, max: 120 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid payment payload.', errors: errors.array() })

    if (!db) return res.status(503).json({ message: 'Database unavailable.' })
    if (!hasRazorpayKeys) return res.status(503).json({ message: 'Razorpay is not configured.' })

    const bookingId = req.body.bookingId
    const bookingSnap = await db.collection('bookings').doc(bookingId).get()
    if (!bookingSnap.exists) return res.status(404).json({ message: 'Booking not found.' })

    const booking = bookingSnap.data()
    if (booking.userId !== req.user.uid) return res.status(403).json({ message: 'Unauthorized.' })

    const amount = Number(booking.totalAmount ?? booking.amount)
    const amountPaise = Math.round(amount * 100)
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ message: 'Invalid booking amount.' })
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: bookingId,
      payment_capture: 1,
      notes: { bookingId, userId: req.user.uid },
    })

    return res.json({
      orderId: order.id,
      amount: amountPaise,
      currency: order.currency || 'INR',
    })
  }),
)

router.post(
  '/verify',
  body('razorpay_order_id').isString(),
  body('razorpay_payment_id').isString(),
  body('razorpay_signature').isString(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid verification payload.', errors: errors.array() })

    if (!hasRazorpayKeys) return res.status(503).json({ message: 'Razorpay is not configured.' })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    return res.json({ verified: expectedSignature === razorpay_signature })
  }),
)

module.exports = router
