import { getAllAchievements, getUserAchievements, checkAndAwardAchievements, getGamification, getLeaderboard } from '../db.js'

export async function listAchievements(req, res) {
  try {
    const achievements = await getAllAchievements()
    res.json({ success: true, data: achievements })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getMyAchievements(req, res) {
  try {
    await checkAndAwardAchievements(req.userId)
    const achievements = await getUserAchievements(req.userId)
    res.json({ success: true, data: achievements })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function checkAchievements(req, res) {
  try {
    const awarded = await checkAndAwardAchievements(req.userId)
    res.json({ success: true, awarded })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getMyGamification(req, res) {
  try {
    await checkAndAwardAchievements(req.userId)
    const gamification = await getGamification(req.userId)
    const achievements = await getUserAchievements(req.userId)
    const unlockedCount = achievements.filter((a) => a.earned_at).length
    const totalCount = (await getAllAchievements()).length
    res.json({ success: true, data: { ...gamification, unlockedCount, totalCount } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getLeaderboardHandler(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const leaderboard = await getLeaderboard(limit)
    res.json({ success: true, data: leaderboard })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
