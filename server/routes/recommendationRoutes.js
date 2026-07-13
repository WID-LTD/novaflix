import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getRecommendations, getTrending, getSimilar } from '../controllers/recommendationController.js'

const router = Router()

router.get('/for-you', authMiddleware, getRecommendations)
router.get('/trending', getTrending)
router.get('/similar/:id', getSimilar)

export default router
