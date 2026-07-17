import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as hooksController from '../controllers/hooksController.js'

const router = Router()

router.get('/', authMiddleware, hooksController.getFeed)

export default router
