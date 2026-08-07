import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { pool } from '../db.js'

const router = Router()

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body
    if (!targetType || !targetId) return res.status(400).json({ error: 'targetType and targetId required' })
    const { rows } = await pool.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.userId, targetType, targetId, reason || 'other', details || '']
    )
    res.json({ success: true, report: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router