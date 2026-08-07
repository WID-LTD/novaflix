import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { today, submitDaily, streak, leaderboard, guess, submitGuess, coins, listCosmetics, purchase, equip, seedCatalog } from '../controllers/triviaController.js'

const router = Router()

router.get('/today', authMiddleware, today)
router.post('/submit', authMiddleware, submitDaily)
router.get('/streak', authMiddleware, streak)
router.get('/leaderboard', authMiddleware, leaderboard)
router.get('/guess', authMiddleware, guess)
router.post('/guess/submit', authMiddleware, submitGuess)
router.get('/coins', authMiddleware, coins)
router.get('/cosmetics', authMiddleware, listCosmetics)
router.post('/cosmetics/seed', authMiddleware, seedCatalog)
router.post('/cosmetics/:id/purchase', authMiddleware, purchase)
router.post('/cosmetics/:id/equip', authMiddleware, equip)

export default router
