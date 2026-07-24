import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listAchievements, getMyAchievements, checkAchievements } from '../controllers/achievementController.js'

const router = Router()

router.get('/', listAchievements)
router.get('/mine', authMiddleware, getMyAchievements)
router.post('/check', authMiddleware, checkAchievements)

export default router
