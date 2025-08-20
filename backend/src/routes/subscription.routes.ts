
import { Router } from 'express';
import { createSubscriptionOrder, handleAlipayWebhook } from '../controllers/subscription.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/create-order', protect, createSubscriptionOrder);
router.post('/webhook/alipay', handleAlipayWebhook); // This webhook is open

export default router;
