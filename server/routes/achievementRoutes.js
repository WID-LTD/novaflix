import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listAchievements, getMyAchievements, checkAchievements, getMyGamification, getLeaderboardHandler } from '../controllers/achievementController.js'

const router = Router()

router.get('/', listAchievements)
router.get('/mine', authMiddleware, getMyAchievements)
router.post('/check', authMiddleware, checkAchievements)
router.get('/me/stats', authMiddleware, getMyGamification)
router.get('/leaderboard', getLeaderboardHandler)

export default router
