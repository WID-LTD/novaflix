import pool from '../config/database.js'

/**
 * requireCreator — Blocks non-creators with 403.
 * Must be used AFTER authMiddleware.
 */
export function requireCreator(req, res, next) {
  if (!req.user || (req.user.role !== 'creator' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Creator access required' })
  }
  next()
}

/**
 * requireApprovedCreator — Blocks creators without approved profile.
 * Must be used AFTER authMiddleware + requireCreator.
 * Admins bypass approval check.
 */
export async function requireApprovedCreator(req, res, next) {
  if (req.user.role === 'admin') return next()

  try {
    const { rows } = await pool.query(
      'SELECT approval_status FROM creator_profiles WHERE user_id = $1',
      [req.userId]
    )

    if (!rows.length || !rows[0].approval_status || rows[0].approval_status !== 'approved') {
      return res.status(403).json({
        error: 'Creator account pending approval',
        status: rows[0]?.approval_status || 'none'
      })
    }
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
