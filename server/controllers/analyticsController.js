import pool from '../config/database.js'

const PERIODS = {
  '7d': "NOW() - INTERVAL '7 days'",
  '30d': "NOW() - INTERVAL '30 days'",
  '90d': "NOW() - INTERVAL '90 days'",
}

function periodExpr(period) {
  return PERIODS[period] || PERIODS['30d']
}

function bucketExpr(period, col = 'ts') {
  const unit = period === '90d' ? 'week' : 'day'
  return `date_trunc('${unit}', ${col})`
}

export async function getAnalyticsOverview(req, res) {
  try {
    const { period = '30d' } = req.query
    const since = periodExpr(period)
    const bucket = bucketExpr(period)
    const userId = req.userId

    const [views, watch, engagement, revenue, earningsSeries, totals] = await Promise.all([
      // Views over time
      pool.query(`
        SELECT ${bucketExpr(period, 'watched_at')} AS date, COUNT(*) AS total
        FROM watch_history
        WHERE content_id IN (SELECT id::text FROM uploads WHERE user_id = $1)
          AND watched_at > ${since}
        GROUP BY date ORDER BY date
      `, [userId]),

      // Watch minutes over time
      pool.query(`
        SELECT ${bucketExpr(period, 'watched_at')} AS date, COALESCE(SUM(minutes), 0)::bigint AS minutes
        FROM watch_history
        WHERE content_id IN (SELECT id::text FROM uploads WHERE user_id = $1)
          AND watched_at > ${since}
        GROUP BY date ORDER BY date
      `, [userId]),

      // Engagement (comments + likes) over time
      pool.query(`
        SELECT ${bucket} AS date, COUNT(*) AS total
        FROM (
          SELECT c.created_at AS ts FROM comments c
            WHERE c.creator_id = $1 AND c.created_at > ${since}
          UNION ALL
          SELECT l.created_at AS ts FROM likes l
            WHERE l.creator_id = $1 AND l.created_at > ${since}
        ) e
        GROUP BY date ORDER BY date
      `, [userId]),

      // Revenue over time from transactions to this creator
      pool.query(`
        SELECT ${bucketExpr(period, 'created_at')} AS date,
          COALESCE(SUM(CASE WHEN type IN ('tip','gift','merch','membership') THEN amount ELSE 0 END), 0) AS total
        FROM transactions
        WHERE creator_id = $1 AND status = 'success' AND created_at > ${since}
        GROUP BY date ORDER BY date
      `, [userId]),

      // VPM earnings over period buckets
      pool.query(`
        SELECT period AS date, COALESCE(SUM(amount), 0) AS total
        FROM creator_earnings
        WHERE creator_id = $1
        GROUP BY period ORDER BY period
      `, [userId]),

      // Snapshot totals
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM uploads WHERE user_id = $1) AS total_uploads,
          (SELECT COUNT(*) FROM followers WHERE following_id = $1) AS total_followers,
          (SELECT COUNT(*) FROM shorts WHERE user_id = $1) AS total_shorts,
          (SELECT COUNT(*) FROM tips WHERE creator_id = $1) AS total_tips
      `, [userId]),
    ])

    // Revenue summary over period
    const { rows: [revTotal] } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'tip' THEN amount ELSE 0 END), 0) AS tips,
        COALESCE(SUM(CASE WHEN type = 'gift' THEN amount ELSE 0 END), 0) AS gifts,
        COALESCE(SUM(CASE WHEN type = 'merch' THEN amount ELSE 0 END), 0) AS merch,
        COALESCE(SUM(CASE WHEN type = 'membership' THEN amount ELSE 0 END), 0) AS membership,
        COALESCE(SUM(amount), 0) AS total
      FROM transactions
      WHERE creator_id = $1 AND status = 'success' AND created_at > ${since}
    `, [userId])

    res.json({
      success: true,
      period,
      series: {
        views: views.rows,
        watch: watch.rows,
        engagement: engagement.rows,
        revenue: revenue.rows,
        earnings: earningsSeries.rows,
      },
      totals: totals.rows[0],
      revenueSummary: revTotal,
      generatedAt: Date.now(),
    })
  } catch (err) {
    console.error('[analytics] overview error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to load analytics' })
  }
}

export async function getAnalyticsAudience(req, res) {
  try {
    const { period = '30d' } = req.query
    const since = periodExpr(period)
    const userId = req.userId

    const [followersOverTime, topContent] = await Promise.all([
      // Follower growth over time
      pool.query(`
        SELECT ${bucketExpr(period, 'created_at')} AS date, COUNT(*) AS total
        FROM followers
        WHERE following_id = $1 AND created_at > ${since}
        GROUP BY date ORDER BY date
      `, [userId]),

      // Top performing content
      pool.query(`
        SELECT u.id, u.title, u.genre,
               COUNT(wh.id) AS views,
               COALESCE(SUM(wh.minutes), 0)::bigint AS minutes
        FROM uploads u
        LEFT JOIN watch_history wh ON wh.content_id = u.id::text AND wh.watched_at > ${since}
        WHERE u.user_id = $1
        GROUP BY u.id, u.title, u.genre
        ORDER BY views DESC LIMIT 10
      `, [userId]),
    ])

    res.json({
      success: true,
      followersOverTime: followersOverTime.rows,
      topContent: topContent.rows,
      totalFollowers: followersOverTime.rows.reduce((a, b) => a + Number(b.total || 0), 0),
    })
  } catch (err) {
    console.error('[analytics] audience error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to load audience analytics' })
  }
}

export async function getAnalyticsContent(req, res) {
  try {
    const { period = '30d' } = req.query
    const since = periodExpr(period)
    const userId = req.userId

    const [uploads, shorts, byGenre] = await Promise.all([
      pool.query(`
        SELECT u.id, u.title, u.genre, u.status, u.created_at,
               COUNT(wh.id) AS views,
               COALESCE(SUM(wh.minutes), 0)::bigint AS minutes,
               (SELECT COUNT(*) FROM comments c WHERE c.content_id = u.id::text AND c.creator_id = $1) AS comments,
               (SELECT COUNT(*) FROM likes l WHERE l.content_id = u.id::text AND l.creator_id = $1) AS likes
        FROM uploads u
        LEFT JOIN watch_history wh ON wh.content_id = u.id::text AND wh.watched_at > ${since}
        WHERE u.user_id = $1
        GROUP BY u.id
        ORDER BY views DESC
      `, [userId]),
      pool.query(`
        SELECT s.id, s.title,
               COALESCE(s.views, 0) AS views,
               COALESCE(s.likes, 0) AS likes
        FROM shorts s
        WHERE s.user_id = $1
        ORDER BY views DESC LIMIT 20
      `, [userId]),
      pool.query(`
        SELECT COALESCE(u.genre, 'Other') AS genre, COUNT(*) AS count
        FROM uploads u
        WHERE u.user_id = $1
        GROUP BY genre ORDER BY count DESC
      `, [userId]),
    ])

    res.json({
      success: true,
      uploads: uploads.rows,
      shorts: shorts.rows,
      byGenre: byGenre.rows,
    })
  } catch (err) {
    console.error('[analytics] content error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to load content analytics' })
  }
}

export default { getAnalyticsOverview, getAnalyticsAudience, getAnalyticsContent }
