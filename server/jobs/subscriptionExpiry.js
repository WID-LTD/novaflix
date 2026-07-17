import pool from '../config/database.js'

export async function deactivateExpiredSubscriptions() {
  try {
    const { rows: expired } = await pool.query(
      `UPDATE subscriptions
       SET active = false
       WHERE active = true AND expires_at IS NOT NULL AND expires_at < NOW()
       RETURNING user_id, plan`
    )

    for (const sub of expired) {
      await pool.query(
        'UPDATE users SET plan = $1 WHERE id = $2',
        ['free', sub.user_id]
      )
    }

    if (expired.length > 0) {
      console.log(`[cron] Deactivated ${expired.length} expired subscription(s)`)
    }
    return expired.length
  } catch (err) {
    console.error('[cron] Subscription expiry error:', err.message)
    return 0
  }
}
