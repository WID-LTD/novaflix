import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware, requirePermission } from '../middleware/admin.js'
import { submitAppeal, myAppeals } from '../controllers/appealController.js'

const router = Router()

router.post('/', authMiddleware, submitAppeal)
router.get('/mine', authMiddleware, myAppeals)

export default router
