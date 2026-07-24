import { getAllAchievements, getUserAchievements, checkAndAwardAchievements } from '../db.js'

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
