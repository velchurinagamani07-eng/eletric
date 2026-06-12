const express = require('express')
const { body, validationResult } = require('express-validator')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()

router.post(
  '/',
  body('message').isString().trim().isLength({ min: 1, max: 1000 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid chat message.', errors: errors.array() })

    const userMessage = req.body.message
    const systemPrompt =
      'You are HomeElectric Assistant. Help users book home electrical services, check booking status, estimate prices, explain warranty, and offer WhatsApp handoff when needed. Keep replies short.'

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
          max_tokens: 220,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text
      if (response.ok && reply) return res.json({ reply })
    }

    const lower = userMessage.toLowerCase()
    const reply = lower.includes('booking')
      ? 'Open Book a Service, choose service, address, date/time, coupon, and payment. You can track it from My Bookings.'
      : lower.includes('price') || lower.includes('quote')
        ? 'Services start from Rs. 149. The final price depends on service type, parts, and address details.'
        : lower.includes('human')
          ? 'I can hand you to support through WhatsApp. Tap the WhatsApp contact button on the site.'
          : 'I can help with booking, service pricing, warranty, receipts, and worker assignment status.'

    return res.json({ reply, demo: true })
  }),
)

module.exports = router

