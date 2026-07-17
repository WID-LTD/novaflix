import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { create, update, list, get, listAll } from '../controllers/archiveController.js'

const router = Router()

router.post('/', authMiddleware, create)
router.patch('/:id', authMiddleware, update)
router.get('/', list)
router.get('/all', authMiddleware, listAll)
router.get('/:id', authMiddleware, get)

export default router
