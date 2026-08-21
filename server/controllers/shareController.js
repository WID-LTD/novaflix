import * as db from '../db.js'

export async function createLink(req, res) {
  try {
    const { contentId, contentType, creatorId } = req.body
    if (!contentId) return res.status(400).json({ error: 'contentId required' })

    let link = await db.getShareLinkByContent(req.userId, contentId, contentType || 'movie')
    if (!link) {
      let code = db.genShareCode()
      link = await db.createShareLink({
        code,
        contentId,
        contentType: contentType || 'movie',
        creatorId,
        createdBy: req.userId,
      })
      if (!link) {
        code = db.genShareCode()
        link = await db.createShareLink({
          code,
          contentId,
          contentType: contentType || 'movie',
          creatorId,
          createdBy: req.userId,
        })
      }
    }

    const host = req.get('host') || 'localhost:3000'
    const protocol = req.protocol
    const baseUrl = `${protocol}://${host}`
    const deepLink = `novaflix://content/${contentId}?ref=${link.code}`
    const webLink = `${baseUrl}/${contentType}/${contentId}?ref=${link.code}`
    const resolveUrl = `${baseUrl}/api/share/${link.code}`

    // Enhanced share data for native share
    const shareData = {
      title: 'Check this out on NovaFlix',
      text: `Check out this content on NovaFlix`,
      url: webLink,
    }

    res.json({ 
      success: true, 
      shareLink: { 
        ...link, 
        deepLink, 
        webLink, 
        resolveUrl,
        shareData,
        nativeShareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + webLink)}&source=novaflix`,
        twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(webLink)}`,
        facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(webLink)}`,
        telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(webLink)}&text=${encodeURIComponent(shareData.title)}`,
        linkedinUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(webLink)}`,
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function resolveLink(req, res) {
  try {
    const link = await db.incrementShareClicks(req.params.code)
    if (!link) return res.status(404).json({ error: 'Link not found' })
    res.json({
      success: true,
      redirect: `/${link.content_type}/${link.content_id}`,
      contentId: link.content_id,
      contentType: link.content_type,
      clicks: link.clicks,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getStats(req, res) {
  try {
    const { contentId, contentType } = req.query
    if (!contentId) return res.status(400).json({ error: 'contentId required' })
    const stats = await db.getShareLinkStats(contentId, contentType || 'movie')
    res.json({ success: true, stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get share link with rich preview data
export async function getSharePreview(req, res) {
  try {
    const { contentId, contentType } = req.query
    if (!contentId) return res.status(400).json({ error: 'contentId required' })

    // Get content details for rich preview
    let content = null
    if (contentType === 'tv') {
      const { rows } = await pool.query(
        `SELECT id, title, overview, backdrop_path, first_air_date FROM tmdb_tv WHERE id = $1`,
        [contentId]
      )
      content = rows[0]
    } else {
      const { rows } = await pool.query(
        `SELECT id, title, overview, backdrop_path, release_date FROM tmdb_movies WHERE id = $1`,
        [contentId]
      )
      content = rows[0]
    }

    if (!content) {
      // Try creator uploads
      const { rows } = await pool.query(
        `SELECT id, title, description, thumbnail_url, genre FROM uploads WHERE id = $1`,
        [contentId]
      )
      content = rows[0]
    }

    const baseUrl = process.env.APP_URL || 'https://nova-flix.com.ng'
    const preview = {
      title: content?.title || 'NovaFlix Content',
      description: content?.overview || content?.description || 'Check out this content on NovaFlix',
      image: content?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}` : 
             content?.thumbnail_url || null,
      url: `${baseUrl}/${contentType || 'movie'}/${contentId}`,
      type: contentType || 'movie',
    }

    res.json({ success: true, preview })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Track share events for analytics
export async function trackShare(req, res) {
  try {
    const { contentId, contentType, platform, shareMethod } = req.body
    if (!contentId || !platform) return res.status(400).json({ error: 'contentId and platform required' })

    await pool.query(
      `INSERT INTO share_analytics (content_id, content_type, platform, share_method, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [contentId, contentType || 'movie', platform, shareMethod || 'native', req.userId]
    )

    // Increment share count
    await pool.query(
      `UPDATE share_links SET shares = shares + 1 WHERE content_id = $1 AND content_type = $2`,
      [contentId, contentType || 'movie']
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get share analytics for creator
export async function getShareAnalytics(req, res) {
  try {
    const { contentId, contentType, period = '30d' } = req.query
    if (!contentId) return res.status(400).json({ error: 'contentId required' })

    const interval = period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'
    
    const { rows } = await pool.query(
      `SELECT platform, share_method, COUNT(*) as count, DATE_TRUNC('day', created_at) as date
       FROM share_analytics
       WHERE content_id = $1 AND content_type = $2 AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY platform, share_method, DATE_TRUNC('day', created_at)
       ORDER BY date DESC`,
      [contentId, contentType || 'movie']
    )

    res.json({ success: true, analytics: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Create share link with custom parameters
export async function createCustomLink(req, res) {
  try {
    const { contentId, contentType, customTitle, customDescription, customImage, utmSource, utmMedium, utmCampaign } = req.body
    if (!contentId) return res.status(400).json({ error: 'contentId required' })

    const code = db.genShareCode()
    const link = await db.createShareLink({
      code,
      contentId,
      contentType: contentType || 'movie',
      creatorId: req.body.creatorId,
      createdBy: req.userId,
      customTitle,
      customDescription,
      customImage,
      utmParams: { utmSource, utmMedium, utmCampaign },
    })

    if (!link) return res.status(500).json({ error: 'Failed to create link' })

    const host = req.get('host') || 'localhost:3000'
    const protocol = req.protocol
    const baseUrl = `${protocol}://${host}`
    const webLink = `${baseUrl}/${contentType || 'movie'}/${contentId}?ref=${link.code}&utm_source=${utmSource || 'share'}&utm_medium=${utmMedium || 'social'}&utm_campaign=${utmCampaign || 'content_share'}`

    res.json({ 
      success: true, 
      shareLink: { ...link, webLink, deepLink: `novaflix://content/${contentId}?ref=${link.code}` }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

import pool from '../config/database.js'