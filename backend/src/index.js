require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const PORT = process.env.PORT || 4001

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return null
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body || {}
  if (!to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: 'Missing recipients (to)' })
  }

  const transporter = createTransport()
  if (!transporter) return res.status(500).json({ error: 'SMTP not configured on server' })

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to.join(','),
      subject: subject || 'Notification',
      text: text || '',
      html: html || undefined,
    })
    return res.json({ ok: true, info })
  } catch (err) {
    console.error('send-email error', err)
    return res.status(500).json({ error: String(err) })
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Backend listening on ${PORT}`))
