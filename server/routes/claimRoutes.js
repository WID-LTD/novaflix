import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as claimController from '../controllers/claimController.js';

const router = Router();

// Public claim flow
router.post('/claim/start', claimController.startClaim);
router.get('/claim/preview/:tmdbPersonId', claimController.getClaimPreview);
router.get('/claim/status/:claimId', claimController.getClaimStatus);

// Persona webhook (no auth)
router.post('/claim/persona/webhook', 
  (req, res, next) => {
    // Capture raw body for webhook verification
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  },
  claimController.handlePersonaWebhook
);

// Admin routes
router.get('/admin/claims', authMiddleware, claimController.adminListClaims);
router.post('/admin/claims/:claimId/approve', authMiddleware, claimController.adminApproveClaim);
router.post('/admin/claims/:claimId/deny', authMiddleware, claimController.adminDenyClaim);

export default router;