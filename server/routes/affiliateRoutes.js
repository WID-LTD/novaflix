import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as affiliateController from '../controllers/affiliateController.js'

const router = Router()

router.post('/generate', authMiddleware, affiliateController.generateReferral)
router.get('/stats', authMiddleware, affiliateController.getStats)
router.post('/redeem', authMiddleware, affiliateController.redeemReferral)

export default router
