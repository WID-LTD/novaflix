import { Router } from 'express'
import * as tmdbController from '../controllers/tmdbController.js'

const router = Router()

router.get('/search', tmdbController.search)
router.get('/details', tmdbController.details)
router.get('/tv-season', tmdbController.tvSeason)

export default router
