import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as creatorAuthController from '../controllers/creatorAuthController.js'

const router = Router()

router.post('/register', creatorAuthController.register)
router.post('/login', creatorAuthController.login)
router.get('/me', authMiddleware, creatorAuthController.getMe)

export default router
