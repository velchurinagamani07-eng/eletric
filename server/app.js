require('dotenv').config()

const compression = require('compression')
const cors = require('cors')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const adminRouter = require('./routes/admin')
const bookingsRouter = require('./routes/bookings')
const workersRouter = require('./routes/workers')
const notificationsRouter = require('./routes/notifications')
const chatbotRouter = require('./routes/chatbot')
const contactRouter = require('./routes/contact')
const uploadsRouter = require('./routes/uploads')
const paymentsRouter = require('./routes/payments')
const { isFirebaseAdminConfigured } = require('./services/firebaseAdmin')

const app = express()

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ok: true,
    service: 'home-electric-services-api',
    firebaseAdmin: isFirebaseAdminConfigured,
    payments: 'direct-upi',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/admin', adminRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/workers', workersRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/chatbot', chatbotRouter)
app.use('/api/contact', contactRouter)
app.use('/api/payments', paymentsRouter)

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found.' })
})

app.use((error, req, res, next) => {
  const status = error.status || 500
  res.status(status).json({
    message: status === 500 ? 'Internal server error.' : error.message,
    details: process.env.NODE_ENV === 'production' ? undefined : error.message,
  })
})

module.exports = app
