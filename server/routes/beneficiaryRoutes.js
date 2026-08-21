import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as beneficiaryController from '../controllers/beneficiaryController.js';

const router = Router();

// Beneficiary management
router.post('/beneficiary', authMiddleware, beneficiaryController.createBeneficiary);
router.get('/beneficiary', authMiddleware, beneficiaryController.getBeneficiaries);

// Bank codes (public for dropdown)
router.get('/banks', beneficiaryController.getBankCodes);

// Bank account verification
router.post('/banks/verify', authMiddleware, beneficiaryController.verifyBankAccount);

export default router;