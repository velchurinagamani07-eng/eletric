const express = require('express')
const { body, validationResult } = require('express-validator')
const asyncHandler = require('../utils/asyncHandler')
const { db, admin } = require('../services/firebaseAdmin')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(verifyFirebaseToken)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!db) return res.json({ bookings: [], demo: true })

    const ref =
      req.user.role === 'admin'
        ? db.collection('bookings').orderBy('createdAt', 'desc').limit(50)
        : db.collection('bookings').where('userId', '==', req.user.uid).limit(50)
    const snapshot = await ref.get()
    return res.json({ bookings: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) })
  }),
)

router.post(
  '/',
  body('serviceId').isString(),
  body('serviceName').isString(),
  body('date').isISO8601(),
  body('timeSlot').isString(),
  body('amount').isFloat({ min: 0 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid booking payload.', errors: errors.array() })

    const booking = {
      ...req.body,
      userId: req.user.uid,
      status: req.body.status || 'pending',
      paymentStatus: req.body.paymentStatus || 'pending',
      workerUID: req.body.workerUID || null,
      createdAt: db ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      updatedAt: db ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
    }

    if (!db) return res.status(201).json({ id: `booking_demo_${Date.now()}`, ...booking, demo: true })

    const doc = await db.collection('bookings').add(booking)
    return res.status(201).json({ id: doc.id, ...booking })
  }),
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!db) return res.json({ id: req.params.id, ...req.body, demo: true })
    await db.collection('bookings').doc(req.params.id).set(
      {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    return res.json({ id: req.params.id, ...req.body })
  }),
)

router.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const code = `THANKS${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const value = Number(req.body.couponValue || 100)

    if (!db) {
      return res.json({
        bookingId: req.params.id,
        status: 'completed',
        coupon: { code, type: 'flat', value, expiresIn: '30 days' },
        demo: true,
      })
    }

    const bookingRef = db.collection('bookings').doc(req.params.id)
    const bookingSnap = await bookingRef.get()
    const booking = bookingSnap.data()
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    await bookingRef.set(
      {
        status: 'completed',
        couponSentToUser: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    await db.collection('coupons').add({
      code,
      type: 'flat',
      value,
      userId: booking?.userId,
      singleUse: true,
      expiresAt,
      isActive: true,
      usedBy: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    await db.collection('notifications').add({
      userId: booking?.userId,
      role: 'user',
      title: 'Job complete',
      body: `Job complete! Use code ${code} for Rs. ${value} off your next booking.`,
      type: 'completion_coupon',
      bookingId: req.params.id,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.json({ bookingId: req.params.id, status: 'completed', coupon: { code, value } })
  }),
)

module.exports = router

