import { v4 as uuidv4 } from 'uuid'
import { addShort, getShortsFeed, getShortsCount, getShortById, incrementShortViews, toggleShortLike, toggleShortBookmark, incrementShortShares, getShortComments, addShortComment, hasUserLikedShort, deleteShort } from '../db.js'
import { uploadFile, deleteFile } from '../lib/r2.js'
import { broadcastFeed } from '../services/realtime.js'

export async function createShort(req, res) {
  try {
    const { title, description, durationSeconds } = req.body
    if (!title) return res.status(400).json({ error: 'Title required' })

    const videoFile = req.files?.video?.[0]
    if (!videoFile) return res.status(400).json({ error: 'Video file required' })

    const ext = videoFile.originalname.split('.').pop() || 'mp4'
    const id = uuidv4()
    const videoKey = `shorts/${req.userId}/${id}.${ext}`
    const result = await uploadFile({ buffer: videoFile.buffer, key: videoKey, contentType: videoFile.mimetype })
    if (!result.success) return res.status(500).json({ error: 'Video upload failed' })

    let thumbnailUrl = ''
    const thumbFile = req.files?.thumbnail?.[0]
    if (thumbFile) {
      const thumbKey = `shorts/${req.userId}/${id}-thumb.jpg`
      const tRes = await uploadFile({ buffer: thumbFile.buffer, key: thumbKey, contentType: thumbFile.mimetype })
      if (tRes.success) thumbnailUrl = tRes.url
    }

    const short = {
      id,
      userId: req.userId,
      title,
      description: description || '',
      videoUrl: result.url,
      thumbnailUrl,
      durationSeconds: parseInt(durationSeconds) || 0,
      status: 'active',
    }
    const created = await addShort(short)
    res.json({ success: true, short: created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getShorts(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = 30
    const offset = (page - 1) * limit
    const [shorts, total] = await Promise.all([getShortsFeed(limit, offset, req.userId || null), getShortsCount()])
    res.json({ success: true, shorts, total, page, nextPage: offset + shorts.length < total ? page + 1 : undefined })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getShort(req, res) {
  try {
    const short = await getShortById(req.params.id)
    if (!short) return res.status(404).json({ error: 'Short not found' })
    if (req.userId) short.liked = await hasUserLikedShort(short.id, req.userId)
    res.json({ success: true, short })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function recordShortView(req, res) {
  try {
    const updated = await incrementShortViews(req.params.id)
    if (!updated) return res.status(404).json({ error: 'Short not found' })
    broadcastFeed({ type: 'shorts:view', shortId: req.params.id, views: updated.views })
    if (updated.user_id) {
      broadcastFeed({ type: 'view', contentType: 'creator', contentId: updated.user_id })
    }
    res.json({ success: true, views: updated.views })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function likeShort(req, res) {
  try {
    const result = await toggleShortLike(req.params.id, req.userId)
    broadcastFeed({ type: 'shorts:like', shortId: req.params.id, likes: result.likes })
    if (result.creator_id) {
      broadcastFeed({ type: 'like', contentType: 'creator', contentId: result.creator_id, liked: result.liked })
    }
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function bookmarkShort(req, res) {
  try {
    const result = await toggleShortBookmark(req.params.id, req.userId)
    broadcastFeed({ type: 'shorts:bookmark', shortId: req.params.id, bookmarks: result.bookmarks })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function shareShort(req, res) {
  try {
    const result = await incrementShortShares(req.params.id)
    if (!result) return res.status(404).json({ error: 'Short not found' })
    broadcastFeed({ type: 'shorts:share', shortId: req.params.id, shares: result.shares })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function listShortComments(req, res) {
  try {
    const comments = await getShortComments(req.params.id)
    res.json({ success: true, comments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function createShortComment(req, res) {
  try {
    const text = (req.body.text || '').trim()
    if (!text) return res.status(400).json({ error: 'Comment text required' })
    const comment = await addShortComment(req.params.id, req.userId, text)
    if (!comment) return res.status(404).json({ error: 'Short not found' })
    broadcastFeed({ type: 'shorts:comment', shortId: req.params.id, comment })
    res.json({ success: true, comment })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function removeShort(req, res) {
  try {
    const short = await getShortById(req.params.id)
    if (!short) return res.status(404).json({ error: 'Short not found' })
    if (short.user_id !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' })
    }
    const key = short.video_url?.split('/').slice(-2).join('/')
    if (key && short.video_url.includes('shorts/')) {
      deleteFile(`shorts/${key}`).catch(() => {})
    }
    await deleteShort(short.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
