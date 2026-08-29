import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { findUserById, updateUser, getUserSettings, updateUserSettings, getUploadsByUserId, getTotalMinutesWatched, getUserSubscription, addWatchEntry, getWatchHistory, getContinueWatching, checkAndAwardAchievements, addXp, addToWatchlist, getWatchlistByUserId, removeFromWatchlist, getWatchlistCount } from '../db.js'
import { notifyUser } from '../services/realtime.js'
import { uploadFile } from '../lib/r2.js'

export async function updateProfile(req, res) {
  try {
    const { name, bio, avatar } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (avatar !== undefined) updates.avatar = avatar
    const updated = await updateUser(req.userId, updates)
    if (!updated) return res.status(404).json({ error: 'User not found' })
    const safe = { ...updated, password: undefined }
    res.json({ success: true, user: safe })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }
    const user = await findUserById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' })
    const hashed = await bcrypt.hash(newPassword, 10)
    await updateUser(req.userId, { password: hashed })
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function deleteAccount(req, res) {
  try {
    const user = await findUserById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const pool = (await import('../db.js')).pool
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId])
    res.json({ success: true, message: 'Account deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getStats(req, res) {
  try {
    const user = await findUserById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const [sub, minutes, uploads, watchlistCount] = await Promise.all([
      getUserSubscription(req.userId),
      getTotalMinutesWatched(req.userId),
      getUploadsByUserId(req.userId),
      getWatchlistCount(req.userId),
    ])
    res.json({
      success: true,
      stats: {
        minutesWatched: minutes,
        watchlistCount,
        uploadsCount: uploads.length,
        plan: user.plan || 'free',
        subscription: sub || null,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addWatchEntryHandler(req, res) {
  try {
    const { contentId, title, type, minutes, season, episode, positionSeconds, durationSeconds, poster } = req.body
    const entry = {
      id: uuidv4(),
      userId: req.userId,
      contentId,
      title,
      type,
      minutes: minutes || 0,
      season: season || null,
      episode: episode || null,
      positionSeconds: positionSeconds || 0,
      durationSeconds: durationSeconds || 0,
      poster: poster || null,
    }
    await addWatchEntry(entry)
    addXp(req.userId, 5).catch(() => {})
    checkAndAwardAchievements(req.userId).catch(() => {})
    res.json({ success: true, entry })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getWatchHistoryHandler(req, res) {
  try {
    const history = await getWatchHistory(req.userId)
    res.json({ success: true, history })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getContinueWatchingHandler(req, res) {
  try {
    const history = await getContinueWatching(req.userId)
    res.json({ success: true, history })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getSettingsHandler(req, res) {
  try {
    const settings = await getUserSettings(req.userId)
    res.json({ success: true, settings: settings || {} })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateSettingsHandler(req, res) {
  try {
    const body = req.body || {}
    const settings = typeof body.settings === 'object' && body.settings !== null ? body.settings : body
    const saved = await updateUserSettings(req.userId, settings)
    // Broadcast to user's other devices
    try { notifyUser(req.userId, { type: 'settings:updated', settings: saved }) } catch {}
    res.json({ success: true, settings: saved || {} })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' })

    const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg'
    const key = `avatars/${req.userId}.${ext}`

    const result = await uploadFile({
      buffer: req.file.buffer,
      key,
      contentType: req.file.mimetype,
    })

    if (!result.success) return res.status(500).json({ error: 'Upload failed' })

    await updateUser(req.userId, { avatar: result.url })
    res.json({ success: true, url: result.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function addToWatchlistHandler(req, res) {
  try {
    const { contentId, contentType, title, poster, year } = req.body
    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'contentId and contentType required' })
    }
    const entry = await addToWatchlist({
      id: uuidv4(),
      userId: req.userId,
      contentId: String(contentId),
      contentType,
      title: title || null,
      poster: poster || null,
      year: year || null,
    })
    res.json({ success: true, entry })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getWatchlistHandler(req, res) {
  try {
    const items = await getWatchlistByUserId(req.userId)
    res.json({ success: true, items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function removeFromWatchlistHandler(req, res) {
  try {
    const { contentId } = req.params
    const removed = await removeFromWatchlist(req.userId, contentId)
    res.json({ success: true, removed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
