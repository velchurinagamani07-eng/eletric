const express = require('express')
const { body, validationResult } = require('express-validator')
const asyncHandler = require('../utils/asyncHandler')
const { admin, auth, db } = require('../services/firebaseAdmin')
const { requireAdmin } = require('../middleware/adminMiddleware')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(verifyFirebaseToken, requireAdmin)

router.post(
  '/generate-description',
  body('serviceName').isString().trim().isLength({ min: 2, max: 80 }),
  body('category').isString().trim().isLength({ min: 2, max: 50 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid service payload.', errors: errors.array() })

    const { serviceName, category } = req.body
    const prompt = `Write a professional, SEO-friendly 3-sentence service description for a home electrical service called "${serviceName}" in the category "${category}". Focus on benefits, safety, and the 3-month warranty. Keep it under 60 words.`

    if (process.env.ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 180,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      const description = data.content?.[0]?.text
      if (response.ok && description) return res.json({ description })
    }

    return res.json({
      description: `${serviceName} is completed by verified electricians with safe diagnosis, clean workmanship, and transparent pricing. We focus on reliable wiring practices, appliance protection, and careful final testing. Every completed ${category} service includes a 3-month warranty.`,
      prompt,
    })
  }),
)

router.post(
  '/create-worker',
  body('name').isString().trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('mobile').isString().trim().isLength({ min: 10 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid worker payload.', errors: errors.array() })

    if (!auth || !db) {
      return res.status(201).json({
        uid: `worker_demo_${Date.now()}`,
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        specialization: req.body.specialization || '',
        role: 'worker',
        demo: true,
      })
    }

    const user = await auth.createUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.name,
    })

    const now = admin.firestore.FieldValue.serverTimestamp()
    const joinedAt = new Date().toISOString()
    const workerDoc = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      specialization: req.body.specialization || '',
      photoURL: req.body.photoURL || '',
      isActive: true,
      totalJobsCompleted: 0,
      earnings: 0,
      rating: 0,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    await Promise.all([
      auth.setCustomUserClaims(user.uid, { role: 'worker' }),
      db.collection('users').doc(user.uid).set({ ...workerDoc, role: 'worker' }),
      db.collection('workers').doc(user.uid).set(workerDoc),
    ])

    return res.status(201).json({
      uid: user.uid,
      name: workerDoc.name,
      email: workerDoc.email,
      mobile: workerDoc.mobile,
      specialization: workerDoc.specialization,
      photoURL: workerDoc.photoURL,
      isActive: workerDoc.isActive,
      totalJobsCompleted: workerDoc.totalJobsCompleted,
      earnings: workerDoc.earnings,
      rating: workerDoc.rating,
      role: 'worker',
      joinedAt,
      createdAt: joinedAt,
      updatedAt: joinedAt,
    })
  }),
)

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    if (!db) {
      return res.json({
        revenue: 24800,
        bookings: 62,
        pending: 12,
        completed: 44,
        demo: true,
      })
    }

    const bookings = await db.collection('bookings').where('paymentStatus', '==', 'success').limit(200).get()
    const revenue = bookings.docs.reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0)
    return res.json({ revenue, bookings: bookings.size })
  }),
)

module.exports = router
