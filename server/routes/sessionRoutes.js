import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as sessionController from '../controllers/sessionController.js'

const router = Router()

router.post('/start', authMiddleware, sessionController.startSession)
router.post('/heartbeat', authMiddleware, sessionController.heartbeat)
router.post('/end', authMiddleware, sessionController.endSessionHandler)
router.post('/cleanup', sessionController.cleanup)

export default router
