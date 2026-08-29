import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { requireCreator } from '../middleware/creatorAuth.js'
import * as analytics from '../controllers/analyticsController.js'

const router = Router()

// All analytics endpoints require creator role
router.get('/overview', authMiddleware, requireCreator, analytics.getAnalyticsOverview)
router.get('/audience', authMiddleware, requireCreator, analytics.getAnalyticsAudience)
router.get('/content', authMiddleware, requireCreator, analytics.getAnalyticsContent)

export default router
