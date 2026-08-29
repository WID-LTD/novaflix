import { Router } from 'express'
import * as tmdbController from '../controllers/tmdbController.js'
// Hybrid discovery search: handles /search?q=... natively (creators + native
// movies + Top Result) and delegates legacy ?query=&type= calls to TMDB.
import { hybridSearch } from '../controllers/discoveryController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/seed-actors', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  next()
}, tmdbController.seedActors)

router.get('/search', hybridSearch)
router.get('/details', tmdbController.details)
router.get('/credits', tmdbController.credits)
router.get('/tv-season', tmdbController.tvSeason)
router.get('/trending', tmdbController.getTrending)
router.get('/now-playing', tmdbController.getNowPlaying)
router.get('/genres', tmdbController.getGenres)
router.get('/categories/search', tmdbController.searchCategories)
router.get('/category', tmdbController.getCategoryMovies)
router.get('/discover', tmdbController.getDiscover)
router.get('/search/all', tmdbController.searchAll)
router.get('/search/person', tmdbController.searchPerson)
router.get('/person/:id/credits', tmdbController.getPersonCredits)
router.get('/creator/batch-check', tmdbController.batchCheckCreators)

export default router
