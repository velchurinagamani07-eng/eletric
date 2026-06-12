const admin = require('firebase-admin')

const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')
  .replace(/^"|"$/g, '')
const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : '')

let app = null

try {
  if (projectId && clientEmail && privateKey && !privateKey.includes('...') && !admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    })
  } else if (admin.apps.length) {
    app = admin.app()
  }
} catch (error) {
  console.warn(`Firebase Admin disabled: ${error.message}`)
  app = null
}

const isFirebaseAdminConfigured = Boolean(app)

if (isFirebaseAdminConfigured) {
  console.log(`Firebase Admin: Connected to ${projectId}`)
} else {
  console.error('Firebase Admin: NOT configured - check FIREBASE_PRIVATE_KEY in .env')
}

module.exports = {
  admin,
  isFirebaseAdminConfigured,
  auth: isFirebaseAdminConfigured ? admin.auth() : null,
  db: isFirebaseAdminConfigured ? admin.firestore() : null,
  messaging: isFirebaseAdminConfigured ? admin.messaging() : null,
  storageBucket: isFirebaseAdminConfigured ? storageBucket : '',
}
