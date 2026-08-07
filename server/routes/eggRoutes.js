import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  getPlacements,
  collectPlacement,
  getMine,
  getRoom,
  createEgg
} from '../controllers/eggController.js'

const router = Router()

router.use(authMiddleware)

router.get('/', getPlacements)
router.get('/mine', getMine)
router.post('/collect', collectPlacement)
router.get('/room/:id', getRoom)
router.post('/creator', createEgg)

export default router