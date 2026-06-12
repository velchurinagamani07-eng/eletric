const { db } = require('../services/firebaseAdmin')

async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication is required.' })

  if (db) {
    const userDoc = await db.collection('users').doc(req.user.uid).get()
    const role = userDoc.exists ? userDoc.data().role : ''
    if (role === 'admin' || role === 'superadmin') return next()
  }

  return res.status(403).json({ message: 'Admin role is required.' })
}

module.exports = { requireAdmin }
