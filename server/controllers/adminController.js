import { getAllUsers, getPlatformStats, getAllUploads, findUserById, updateUser, getAllNewsletterEmails } from '../db.js'
import { sendNewsletterEmail } from '../services/emailService.js'

export async function getUsers(req, res) {
  try {
    const users = await getAllUsers()
    const safe = users.map(u => ({ ...u, password: undefined }))
    res.json({ success: true, users: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUser(req, res) {
  try {
    const user = await findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const safe = { ...user, password: undefined }
    res.json({ success: true, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateUserRole(req, res) {
  try {
    const { role } = req.body
    if (!['user', 'creator', 'admin', 'banned'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    const updated = await updateUser(req.params.id, { role })
    if (!updated) return res.status(404).json({ error: 'User not found' })
    const safe = { ...updated, password: undefined }
    res.json({ success: true, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function banUser(req, res) {
  try {
    const user = await findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await updateUser(req.params.id, { role: 'banned' })
    res.json({ success: true, message: 'User banned' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getStats(req, res) {
  try {
    const stats = await getPlatformStats()
    res.json({ success: true, stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUploads(req, res) {
  try {
    const uploads = await getAllUploads()
    res.json({ success: true, uploads })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getCreators(req, res) {
  try {
    const { getUsersByRole } = await import('../db.js')
    const creators = await getUsersByRole('creator')
    const safe = creators.map(u => ({ ...u, password: undefined }))
    res.json({ success: true, creators: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function sendNewsletter(req, res) {
  try {
    const { subject, content } = req.body
    if (!subject || !content) return res.status(400).json({ error: 'Subject and content required' })

    const subscribers = await getAllNewsletterEmails()
    if (subscribers.length === 0) return res.json({ success: true, message: 'No subscribers', sent: 0 })

    const results = await Promise.allSettled(
      subscribers.map(s => sendNewsletterEmail(s.email, s.email.split('@')[0], subject, content))
    )
    const sent = results.filter(r => r.status === 'fulfilled').length

    res.json({ success: true, message: `Newsletter sent to ${sent}/${subscribers.length} subscribers`, sent })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getNewsletterSubscribers(req, res) {
  try {
    const subscribers = await getAllNewsletterEmails()
    res.json({ success: true, subscribers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
