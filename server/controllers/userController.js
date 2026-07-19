import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import { findUserById, updateUser, getUploadsByUserId, getTotalMinutesWatched, getUserSubscription, addWatchEntry, getWatchHistory } from '../db.js'

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
    const [sub, minutes, uploads] = await Promise.all([
      getUserSubscription(req.userId),
      getTotalMinutesWatched(req.userId),
      getUploadsByUserId(req.userId),
    ])
    res.json({
      success: true,
      stats: {
        minutesWatched: minutes,
        watchlistCount: 0,
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
    const { contentId, title, type, minutes, season, episode } = req.body
    const entry = {
      id: uuidv4(),
      userId: req.userId,
      contentId,
      title,
      type,
      minutes: minutes || 0,
      season: season || null,
      episode: episode || null,
    }
    await addWatchEntry(entry)
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
