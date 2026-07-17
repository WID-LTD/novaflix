import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function generateReferral(req, res) {
  try {
    const userId = req.userId

    // Check if user already has a code
    const { rows: existing } = await pool.query(
      'SELECT * FROM affiliate_referrals WHERE referrer_id = $1 AND status = $2',
      [userId, 'pending']
    )

    if (existing[0]) {
      return res.json({ success: true, code: existing[0].code, url: `${req.protocol}://${req.get('host')}/register?ref=${existing[0].code}` })
    }

    const code = generateCode()
    const id = uuidv4()
    await pool.query(
      `INSERT INTO affiliate_referrals (id, referrer_id, code, status) VALUES ($1, $2, $3, 'pending')`,
      [id, userId, code]
    )

    res.json({
      success: true,
      code,
      url: `${req.protocol}://${req.get('host')}/register?ref=${code}`,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getStats(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        COALESCE(SUM(commission), 0) as total_commission
       FROM affiliate_referrals WHERE referrer_id = $1`,
      [req.userId]
    )

    const { rows: referrals } = await pool.query(
      `SELECT * FROM affiliate_referrals WHERE referrer_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    )

    res.json({
      success: true,
      stats: rows[0] || { total: 0, converted: 0, total_commission: 0 },
      referrals,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function redeemReferral(req, res) {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Code required' })

    const { rows } = await pool.query(
      'SELECT * FROM affiliate_referrals WHERE code = $1 AND status = $2',
      [code.toUpperCase(), 'pending']
    )

    if (!rows[0]) {
      return res.json({ success: false, error: 'Invalid or expired referral code' })
    }

    // Mark as converted
    await pool.query(
      `UPDATE affiliate_referrals SET status = 'converted', referred_id = $1, converted_at = NOW() WHERE id = $2`,
      [req.userId, rows[0].id]
    )

    res.json({ success: true, message: 'Referral applied!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
