import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { leaderboard, status } from '../controllers/fanController.js'

const router = Router()

router.get('/:creatorId/leaderboard', leaderboard)
router.get('/:creatorId/status', authMiddleware, status)

export default router
