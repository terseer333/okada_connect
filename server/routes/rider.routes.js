import { Router } from 'express';
import { getProfile, updateStatus } from '../controllers/rider.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All rider routes require an authenticated rider.
router.use(requireAuth, requireRole('rider'));

router.get('/profile', getProfile);
router.patch('/status', updateStatus);

export default router;
