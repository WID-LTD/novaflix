import { Router } from 'express'
import * as tmdbController from '../controllers/tmdbController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/seed-actors', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  next()
}, tmdbController.seedActors)

router.get('/search', tmdbController.search)
router.get('/details', tmdbController.details)
router.get('/credits', tmdbController.credits)
router.get('/tv-season', tmdbController.tvSeason)
router.get('/trending', tmdbController.getTrending)
router.get('/now-playing', tmdbController.getNowPlaying)
router.get('/genres', tmdbController.getGenres)
router.get('/category', tmdbController.getCategoryMovies)
router.get('/discover', tmdbController.getDiscover)
router.get('/search/all', tmdbController.searchAll)

export default router
