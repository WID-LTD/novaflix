import * as db from '../db.js'

export async function conversations(req, res) {
  try {
    const convos = await db.getConversations(req.userId)
    res.json({ success: true, conversations: convos })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function messages(req, res) {
  try {
    const { with: otherUserId } = req.query
    if (!otherUserId) return res.status(400).json({ error: 'with (userId) required' })
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200)
    const msgs = await db.getDirectMessages(req.userId, otherUserId, limit)
    const other = await db.findUserById(otherUserId)
    res.json({
      success: true,
      otherUser: other ? { id: other.id, name: other.name, avatar: other.avatar } : null,
      messages: msgs.map((m) => ({
        id: m.id,
        userId: m.user_id,
        name: m.user_name,
        message: m.message,
        timestamp: new Date(m.created_at).getTime(),
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
