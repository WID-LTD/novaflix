import { v4 as uuidv4 } from 'uuid'
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
