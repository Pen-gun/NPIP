import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { createCheckoutSession, handleWebhook } from '../controllers/stripe.controller.js';

const router = Router();

router.post('/checkout', verifyJWT, createCheckoutSession);
router.post('/webhook', handleWebhook);

export default router;
