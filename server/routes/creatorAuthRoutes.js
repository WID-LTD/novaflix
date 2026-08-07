import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as creatorAuthController from '../controllers/creatorAuthController.js'

const router = Router()

router.post('/register', creatorAuthController.register)
router.post('/login', creatorAuthController.login)
router.post('/login/verify', creatorAuthController.loginVerify)
router.post('/forgot-password', creatorAuthController.forgotPassword)
router.post('/reset-password', creatorAuthController.resetPassword)
router.get('/me', authMiddleware, creatorAuthController.getMe)

export default router
