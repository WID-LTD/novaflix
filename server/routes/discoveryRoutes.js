/**
 * discoveryRoutes.js
 * ---------------------------------------------------------------------------
 * Routes for the Spotify-style discovery engine. Mounted at `/creators` in
 * routes/index.js, so:
 *   GET /api/creators/:id -> aggregated creator profile (directed/acted/
 *                            fans-also-like). Public — profiles are the
 *                            storefront of the platform.
 */
import { Router } from 'express'
import { getCreatorProfile } from '../controllers/discoveryController.js'

const router = Router()

router.get('/:id', getCreatorProfile)

export default router
