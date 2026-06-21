const express = require('express')
const { body, validationResult } = require('express-validator')
const asyncHandler = require('../utils/asyncHandler')
const { admin, auth, db } = require('../services/firebaseAdmin')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')
const { requireAdmin } = require('../middleware/adminMiddleware')

const router = express.Router()
router.use(verifyFirebaseToken)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!db) return res.json({ workers: [], demo: true })
    const snapshot = await db.collection('workers').orderBy('createdAt', 'desc').limit(100).get()
    return res.json({ workers: snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })) })
  }),
)

router.post(
  '/',
  requireAdmin,
  body('name').isString().trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('mobile').isString().trim().isLength({ min: 10 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid worker payload.', errors: errors.array() })

    if (!auth || !db) {
      return res.status(201).json({ uid: `worker_demo_${Date.now()}`, ...req.body, role: 'worker', demo: true })
    }

    const user = await auth.createUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.name,
      phoneNumber: req.body.mobile.startsWith('+') ? req.body.mobile : undefined,
    })

    const now = admin.firestore.FieldValue.serverTimestamp()
    const joinedAt = new Date().toISOString()
    const workerDoc = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      phone: req.body.phone || req.body.mobile,
      specialization: req.body.specialization || '',
      specializations: Array.isArray(req.body.specializations) ? req.body.specializations : [],
      serviceAreas: Array.isArray(req.body.serviceAreas) ? req.body.serviceAreas : [],
      photoURL: req.body.photoURL || '',
      isActive: true,
      status: 'active',
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
      phone: workerDoc.phone,
      specialization: workerDoc.specialization,
      specializations: workerDoc.specializations,
      serviceAreas: workerDoc.serviceAreas,
      photoURL: workerDoc.photoURL,
      isActive: workerDoc.isActive,
      status: workerDoc.status,
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

module.exports = router
