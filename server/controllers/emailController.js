import { newsletterSubscribe, newsletterUnsubscribe } from '../db.js'

export async function subscribeNewsletter(req, res) {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email required' })
    await newsletterSubscribe(email)
    res.json({ success: true, message: 'Subscribed to newsletter' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function unsubscribeNewsletter(req, res) {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'Email required' })
    await newsletterUnsubscribe(email)
    res.json({ success: true, message: 'Unsubscribed from newsletter' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
