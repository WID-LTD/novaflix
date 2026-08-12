import { Router } from 'express'
import { recordVisit, getVisitStats } from '../controllers/statsController.js'

const router = Router()

router.post('/visit', recordVisit)
router.get('/visit', getVisitStats)

export default router