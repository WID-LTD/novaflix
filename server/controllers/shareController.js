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
    const deepLink = `myapp://movie/${contentId}`
    const webLink = `${req.protocol}://${host}/movie/${contentId}?ref=${link.code}`
    const resolveUrl = `${req.protocol}://${host}/api/share/${link.code}`
    res.json({ success: true, shareLink: { ...link, deepLink, webLink, resolveUrl } })
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
      redirect: `/movie/${link.content_id}`,
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
