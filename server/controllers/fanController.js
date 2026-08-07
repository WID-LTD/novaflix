import * as db from '../db.js'

export async function leaderboard(req, res) {
  try {
    const { creatorId } = req.params
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' })
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50)
    const fans = await db.getFanLeaderboard(creatorId, limit)
    res.json({ success: true, fans })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function status(req, res) {
  try {
    const { creatorId } = req.params
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' })
    const status = await db.getFanStatus(req.userId, creatorId)
    res.json({ success: true, ...status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
