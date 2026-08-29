import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as ctrl from '../controllers/creatorApplicationController.js'

const router = Router()

// User-facing routes — mounted at /api/creator
router.post('/apply', authMiddleware, ctrl.applyAsCreator)
router.get('/apply/status', authMiddleware, ctrl.getApplicationStatus)

export default router
