import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as downloadController from '../controllers/downloadController.js'

const router = Router()

router.get('/list', authMiddleware, downloadController.list)
router.delete('/:filename', authMiddleware, downloadController.remove)

export default router
