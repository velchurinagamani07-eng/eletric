const express = require('express')
const { body, validationResult } = require('express-validator')
const nodemailer = require('nodemailer')
const asyncHandler = require('../utils/asyncHandler')
const { admin, db } = require('../services/firebaseAdmin')

const router = express.Router()

router.post(
  '/',
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('mobile').isString().trim().isLength({ min: 8, max: 20 }),
  body('email').optional({ values: 'falsy' }).isEmail(),
  body('message').isString().trim().isLength({ min: 5, max: 1500 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid contact payload.', errors: errors.array() })

    const contact = {
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email || '',
      service: req.body.service || '',
      message: req.body.message,
      isRead: false,
      createdAt: db ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
    }

    let id = `contact_demo_${Date.now()}`
    if (db) {
      const doc = await db.collection('contacts').add(contact)
      id = doc.id
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `New Home Electric contact: ${contact.name}`,
        text: `${contact.name}\n${contact.mobile}\n${contact.email}\n${contact.service}\n\n${contact.message}`,
      })
    }

    return res.status(201).json({ id, ...contact })
  }),
)

module.exports = router

