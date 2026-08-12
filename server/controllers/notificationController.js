import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../db.js'

export async function list(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 30
    const offset = parseInt(req.query.offset, 10) || 0
    const items = await getNotifications(req.userId, limit, offset)
    res.json({ success: true, notifications: items, total: items.length, offset, limit })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function unreadCount(req, res) {
  try {
    const count = await getUnreadCount(req.userId)
    res.json({ success: true, count })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function markRead(req, res) {
  try {
    const item = await markNotificationRead(req.params.id, req.userId)
    if (!item) return res.status(404).json({ success: false, error: 'Notification not found' })
    res.json({ success: true, notification: item })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function markAllRead(req, res) {
  try {
    const updated = await markAllNotificationsRead(req.userId)
    res.json({ success: true, updated })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}