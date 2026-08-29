import pool from '../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import { broadcastFeed } from '../services/realtime.js'

/**
 * POST /api/creator/apply — Standard user applies to become a creator
 * Auth: required (any authenticated user)
 * Body: { handle?, bio?, category?, portfolio_url? }
 */
export async function applyAsCreator(req, res) {
  const userId = req.userId

  // Check not already a creator
  if (req.user.role === 'creator' || req.user.role === 'admin') {
    return res.status(409).json({ error: 'Already a creator' })
  }

  // Check no pending application
  const existing = await pool.query(
    'SELECT id, status FROM creator_applications WHERE user_id = $1',
    [userId]
  )
  if (existing.rows.length && existing.rows[0].status === 'pending') {
    return res.status(409).json({ error: 'Application already pending', applicationId: existing.rows[0].id })
  }

  const { handle, bio, category, portfolio_url } = req.body

  // Validate portfolio URL if provided
  if (portfolio_url) {
    try {
      new URL(portfolio_url)
    } catch {
      return res.status(400).json({ error: 'Invalid portfolio URL' })
    }
  }

  // Upsert application
  const { rows } = await pool.query(`
    INSERT INTO creator_applications (user_id, handle, bio, status)
    VALUES ($1, $2, $3, 'pending')
    ON CONFLICT (user_id) DO UPDATE
      SET handle = $2, bio = $3, status = 'pending', reviewed_at = NULL, reviewed_by = NULL
    RETURNING *
  `, [userId, handle || '', bio || ''])

  // Create or update creator_profiles row with pending approval
  await pool.query(`
    INSERT INTO creator_profiles (user_id, display_name, bio, category, portfolio_url, approval_status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    ON CONFLICT (user_id) DO UPDATE
      SET bio = $3, category = $4, portfolio_url = $5, approval_status = 'pending'
  `, [userId, req.user.name, bio || '', category || '', portfolio_url || ''])

  return res.json({ success: true, application: rows[0] })
}

/**
 * GET /api/creator/apply/status — Check own application status
 * Auth: required
 */
export async function getApplicationStatus(req, res) {
  const { rows } = await pool.query(
    'SELECT * FROM creator_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [req.userId]
  )
  if (!rows.length) {
    return res.json({ status: 'none' })
  }
  return res.json({ application: rows[0] })
}

/**
 * GET /api/admin/creator-applications — List all applications (admin)
 * Query: ?status=pending|approved|denied&page=1&limit=20
 */
export async function getCreatorApplications(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit)

    let where = ''
    const params = []
    if (status) {
      params.push(status)
      where = `WHERE ca.status = $${params.length}`
    }

    params.push(Number(limit))
    params.push(offset)

    const { rows } = await pool.query(`
      SELECT ca.*, u.email, u.name, u.avatar, u.created_at as user_created_at,
             cp.display_name, cp.bio as profile_bio, cp.category, cp.portfolio_url,
             cp.approval_status, cp.known_for_department
      FROM creator_applications ca
      JOIN users u ON u.id = ca.user_id
      LEFT JOIN creator_profiles cp ON cp.user_id = ca.user_id
      ${where}
      ORDER BY ca.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)

    // Count query
    const countParams = status ? [status] : []
    const countSql = `SELECT COUNT(*)::int as total FROM creator_applications ca ${status ? 'WHERE ca.status = $1' : ''}`
    const { rows: countRows } = await pool.query(countSql, countParams)

    return res.json({ success: true, applications: rows, total: countRows[0].total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * POST /api/admin/creator-applications/:id/approve — Admin approves application
 */
export async function approveApplication(req, res) {
  const { id } = req.params

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      'SELECT * FROM creator_applications WHERE id = $1 FOR UPDATE',
      [id]
    )
    if (!rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Application not found' })
    }

    const app = rows[0]

    // 1. Update application status
    await client.query(`
      UPDATE creator_applications
      SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
      WHERE id = $2
    `, [req.userId, id])

    // 2. Promote user to creator role
    await client.query(`
      UPDATE users SET role = 'creator', creator_approved = TRUE WHERE id = $1
    `, [app.user_id])

    // 3. Ensure creator_profiles row exists with approved status
    await client.query(`
      INSERT INTO creator_profiles (user_id, display_name, approval_status, approved_at, approved_by)
      VALUES ($1, $2, 'approved', NOW(), $3)
      ON CONFLICT (user_id) DO UPDATE
        SET approval_status = 'approved', approved_at = NOW(), approved_by = $3
    `, [app.user_id, app.handle || req.user.name, req.userId])

    // 4. Initialize PPM config
    await client.query(`
      INSERT INTO creator_ppm_config (creator_id, base_rate) VALUES ($1, 10.00)
      ON CONFLICT (creator_id) DO NOTHING
    `, [app.user_id])

    await client.query('COMMIT')
    broadcastFeed({ type: 'admin:creator.application.approved', userId: app.user_id, applicationId: id, timestamp: Date.now() })
    return res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

/**
 * POST /api/admin/creator-applications/:id/deny — Admin denies application
 */
export async function denyApplication(req, res) {
  const { id } = req.params

  const { rows } = await pool.query(
    'SELECT * FROM creator_applications WHERE id = $1',
    [id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Application not found' })
  }

  await pool.query(`
    UPDATE creator_applications
    SET status = 'denied', reviewed_by = $1, reviewed_at = NOW()
    WHERE id = $2
  `, [req.userId, id])

  // Reset creator_profiles approval status
  await pool.query(`
    UPDATE creator_profiles SET approval_status = 'rejected'
    WHERE user_id = $1
  `, [rows[0].user_id])

  broadcastFeed({ type: 'admin:creator.application.denied', userId: rows[0].user_id, applicationId: id, timestamp: Date.now() })
  return res.json({ success: true })
}
