const crypto = require('crypto')
const express = require('express')
const multer = require('multer')
const asyncHandler = require('../utils/asyncHandler')
const { admin, db, storageBucket } = require('../services/firebaseAdmin')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')
const { requireAdmin } = require('../middleware/adminMiddleware')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (allowed.includes(file.mimetype)) callback(null, true)
    else callback(new Error('Only image and PDF files can be uploaded.'))
  },
})

router.use(verifyFirebaseToken, requireAdmin)

function safeFileName(fileName = 'upload') {
  return String(fileName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'upload'
}

async function uploadBuffer({ file, path, publicUrl = true }) {
  if (!storageBucket) throw Object.assign(new Error('Firebase Storage bucket is not configured.'), { status: 503 })
  const bucket = admin.storage().bucket(storageBucket)
  const token = publicUrl ? crypto.randomUUID() : ''
  const object = bucket.file(path)
  const metadata = {
    cacheControl: publicUrl ? 'public, max-age=31536000' : 'private, max-age=0, no-cache',
  }

  if (token) {
    metadata.metadata = {
      firebaseStorageDownloadTokens: token,
    }
  }

  await object.save(file.buffer, {
    contentType: file.mimetype,
    resumable: false,
    metadata,
  })

  return {
    url: token ? `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${token}` : '',
    path,
    contentType: file.mimetype,
    size: file.size,
  }
}

router.post(
  '/workers/:workerId/profile',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Upload file is required.' })

    const workerId = req.params.workerId
    const result = await uploadBuffer({
      file: req.file,
      path: `workers/${workerId}/profile/profile_${Date.now()}_${safeFileName(req.file.originalname)}`,
    })

    if (db) {
      await Promise.all([
        db.collection('workers').doc(workerId).set({
          photoURL: result.url,
          profilePhotoPath: result.path,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }),
        db.collection('users').doc(workerId).set({
          photoURL: result.url,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }),
      ])
    }

    return res.json(result)
  }),
)

router.post(
  '/workers/:workerId/aadhar',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Upload file is required.' })

    const workerId = req.params.workerId
    const result = await uploadBuffer({
      file: req.file,
      path: `workers/${workerId}/docs/aadhar_${Date.now()}_${safeFileName(req.file.originalname)}`,
      publicUrl: false,
    })

    if (db) {
      await db.collection('workers').doc(workerId).set({
        aadharPath: result.path,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    return res.json(result)
  }),
)

module.exports = router
