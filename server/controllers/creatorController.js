import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database.js'
import { addUpload, getUploadsByUserId, getTipsForCreator, getCommentsForCreator, getTotalLikesForCreator, getCreatorDashboardStats } from '../db.js'

export async function addUploadHandler(req, res) {
  try {
    const { title, description, genre, filename, filesize } = req.body
    if (!title || !genre) return res.status(400).json({ error: 'Title and genre required' })

    const upload = {
      id: uuidv4(),
      userId: req.userId,
      title,
      description: description || '',
      genre,
      filename: filename || `${uuidv4()}.mp4`,
      filesize: filesize || 0,
      status: 'pending',
      views: 0,
      minutesWatched: 0,
      revenue: 0,
    }
    await addUpload(upload)
    res.json({ success: true, upload })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUploads(req, res) {
  try {
    const uploads = await getUploadsByUserId(req.userId)
    res.json({ success: true, uploads })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getStats(req, res) {
  try {
    const [uploads, tips] = await Promise.all([
      getUploadsByUserId(req.userId),
      getTipsForCreator(req.userId),
    ])
    const totalViews = uploads.reduce((acc, u) => acc + (u.views || 0), 0)
    const totalMinutes = uploads.reduce((acc, u) => acc + (u.minutes_watched || 0), 0)
    const totalRevenue = uploads.reduce((acc, u) => acc + parseFloat(u.revenue || 0), 0)
    const tipTotal = tips.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0)

    res.json({
      success: true,
      stats: {
        totalUploads: uploads.length,
        totalViews,
        totalMinutesWatched: totalMinutes,
        revenue: totalRevenue + tipTotal,
        tipRevenue: tipTotal,
        uploads,
        recentTips: tips.slice(-5),
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getDashboard(req, res) {
  try {
    const [uploads, tips, stats, comments, likesCount] = await Promise.all([
      getUploadsByUserId(req.userId),
      getTipsForCreator(req.userId),
      getCreatorDashboardStats(req.userId),
      getCommentsForCreator(req.userId, 10),
      getTotalLikesForCreator(req.userId),
    ])
    const totalViews = uploads.reduce((acc, u) => acc + (u.views || 0), 0)
    const totalMinutes = uploads.reduce((acc, u) => acc + (u.minutes_watched || 0), 0)
    const totalRevenue = uploads.reduce((acc, u) => acc + parseFloat(u.revenue || 0), 0)
    const tipTotal = tips.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0)

    res.json({
      success: true,
      dashboard: {
        totalUploads: uploads.length,
        totalViews,
        totalMinutesWatched: totalMinutes,
        revenue: totalRevenue + tipTotal,
        tipRevenue: tipTotal,
        totalLikes: likesCount,
        totalComments: stats.totalComments,
        uploads,
        recentComments: comments,
        recentTips: tips.slice(-5),
        stats,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getCreatorComments(req, res) {
  try {
    const comments = await getCommentsForCreator(req.userId)
    res.json({ success: true, comments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getPublicCreators(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.avatar, u.bio,
              cp.known_for_department,
              (SELECT COUNT(*) FROM uploads WHERE user_id = u.id) as film_count,
              (SELECT COALESCE(SUM(views), 0) FROM uploads WHERE user_id = u.id) as total_views,
              (SELECT COUNT(*) FROM likes WHERE creator_id = u.id) as total_likes
       FROM users u
       JOIN creator_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'creator'
       ORDER BY total_likes DESC`
    )
    res.json({ success: true, creators: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getGraph(req, res) {
  try {
    const { getArtistGraph } = await import('../db.js')
    const edges = await getArtistGraph(req.userId)
    res.json({ success: true, edges })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
