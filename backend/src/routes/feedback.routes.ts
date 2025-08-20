import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, submitFeedback);

export default router;