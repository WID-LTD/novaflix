import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as paymentController from '../controllers/paymentController.js'

const router = Router()

router.post('/initialize', authMiddleware, paymentController.initialize)
router.get('/verify', authMiddleware, paymentController.verify)
router.post('/webhook', paymentController.webhook)
router.get('/status', authMiddleware, paymentController.status)
router.get('/gateway-info', authMiddleware, paymentController.gatewayInfo)

export default router
