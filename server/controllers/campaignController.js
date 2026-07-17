import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'

export async function create(req, res) {
  try {
    const {
      advertiser_name,
      creative_url,
      creative_type,
      promotion_type = 'grid',
      target_genre,
      target_plan,
      target_media_id,
      max_impressions = 0,
      budget = 0,
      start_date,
      end_date,
    } = req.body

    if (!advertiser_name || !creative_url) {
      return res.status(400).json({ error: 'advertiser_name and creative_url are required' })
    }

    const id = uuidv4()
    await pool.query(
      `INSERT INTO ad_campaigns (id, creator_id, advertiser_name, creative_url, creative_type,
        promotion_type, target_genre, target_plan, target_media_id, max_impressions, budget,
        start_date, end_date, approved, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, true)`,
      [
        id, req.userId, advertiser_name, creative_url, creative_type || 'image',
        promotion_type, target_genre || null, target_plan || null, target_media_id || null,
        max_impressions, budget,
        start_date || new Date().toISOString(), end_date || null,
      ]
    )

    // Auto-create placement for promoted/banner types
    if (promotion_type === 'hooks' || promotion_type === 'banner') {
      await pool.query(
        `INSERT INTO ad_placements (id, campaign_id, content_id, position_type, duration_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), id, target_media_id || null, promotion_type === 'hooks' ? 'promoted' : 'banner', 15]
      )
    }

    res.json({ success: true, campaign: { id } })
  } catch (err) {
    console.error('[campaign] create error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

export async function list(req, res) {
  try {
    const role = req.user?.role
    const isAdmin = role === 'admin'

    let query = `SELECT * FROM ad_campaigns`
    const params = []

    if (!isAdmin) {
      query += ` WHERE creator_id = $1`
      params.push(req.userId)
    }

    query += ` ORDER BY created_at DESC`

    const { rows } = await pool.query(query, params)
    res.json({ success: true, campaigns: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params
    const { active, approved, max_impressions, budget, end_date } = req.body

    // Only admins can approve campaigns
    if (approved !== undefined && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can approve campaigns' })
    }

    const fields = []
    const values = []
    let idx = 1

    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active) }
    if (approved !== undefined) { fields.push(`approved = $${idx++}`); values.push(approved) }
    if (max_impressions !== undefined) { fields.push(`max_impressions = $${idx++}`); values.push(max_impressions) }
    if (budget !== undefined) { fields.push(`budget = $${idx++}`); values.push(budget) }
    if (end_date !== undefined) { fields.push(`end_date = $${idx++}`); values.push(end_date) }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' })

    values.push(id)
    const { rows } = await pool.query(
      `UPDATE ad_campaigns SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    res.json({ success: true, campaign: rows[0] || null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getActivePromoted(req, res) {
  try {
    const { type, genre, limit: limitParam } = req.query
    const resultLimit = Math.min(parseInt(limitParam) || 5, 20)

    let query = `
      SELECT ac.*, ap.position_type, ap.cue_time_seconds, ap.duration_seconds
      FROM ad_campaigns ac
      JOIN ad_placements ap ON ap.campaign_id = ac.id
      WHERE ac.active = true
      AND ac.approved = true
      AND ac.promotion_type = $1
      AND (ac.start_date IS NULL OR ac.start_date <= NOW())
      AND (ac.end_date IS NULL OR ac.end_date >= NOW())
      AND (ac.max_impressions = 0 OR ac.current_impressions < ac.max_impressions)
    `
    const params = [type || 'grid']

    if (genre) {
      query += ` AND (ac.target_genre IS NULL OR ac.target_genre = $2)`
      params.push(genre)
    }

    query += ` ORDER BY ac.created_at DESC LIMIT $${params.length + 1}`
    params.push(resultLimit)

    const { rows } = await pool.query(query, params)
    res.json({ success: true, campaigns: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
