import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { initializeTip, verifyTip } from '../controllers/tipController.js'

const router = Router()

router.post('/initialize', authMiddleware, initializeTip)
router.get('/verify', authMiddleware, verifyTip)

export default router
