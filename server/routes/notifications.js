const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { db, admin, messaging } = require('../services/firebaseAdmin')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(verifyFirebaseToken)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!db) return res.json({ notifications: [], demo: true })
    const snapshot = await db.collection('notifications').where('userId', '==', req.user.uid).limit(50).get()
    return res.json({ notifications: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) })
  }),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const notification = {
      userId: req.body.userId,
      role: req.body.role || 'user',
      title: req.body.title,
      body: req.body.body,
      type: req.body.type || 'info',
      bookingId: req.body.bookingId || null,
      isRead: false,
      createdAt: db ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
    }

    if (!db) return res.status(201).json({ id: `notif_demo_${Date.now()}`, ...notification, demo: true })

    const doc = await db.collection('notifications').add(notification)
    if (messaging && req.body.fcmToken) {
      await messaging.send({
        token: req.body.fcmToken,
        notification: { title: notification.title, body: notification.body },
      })
    }
    return res.status(201).json({ id: doc.id, ...notification })
  }),
)

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    if (!db) return res.json({ id: req.params.id, isRead: true, demo: true })
    await db.collection('notifications').doc(req.params.id).set({ isRead: true }, { merge: true })
    return res.json({ id: req.params.id, isRead: true })
  }),
)

module.exports = router

