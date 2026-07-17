import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as adController from '../controllers/adController.js'

const router = Router()

router.get('/next', authMiddleware, adController.getNextAd)
router.post('/impression', authMiddleware, adController.recordImpression)
router.post('/binge-pass', authMiddleware, adController.grantBingePass)
router.get('/skip-limit', authMiddleware, adController.getSkipLimit)
router.post('/skip', authMiddleware, adController.incrementSkip)

export default router
