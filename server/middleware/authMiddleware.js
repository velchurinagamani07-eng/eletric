const { auth, isFirebaseAdminConfigured } = require('../services/firebaseAdmin')

async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Authentication token is required.' })
  }

  if (!auth || !isFirebaseAdminConfigured) {
    return res.status(503).json({ message: 'Firebase Admin authentication is not configured.' })
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || 'user',
    }
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid Firebase token.', details: error.message })
  }
}

module.exports = { verifyFirebaseToken }
