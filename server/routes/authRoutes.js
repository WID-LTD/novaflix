import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as authController from '../controllers/authController.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/verify-email', authController.verifyEmail)
router.post('/resend-verification', authController.resendVerification)
router.get('/me', authMiddleware, authController.getMe)

export default router
