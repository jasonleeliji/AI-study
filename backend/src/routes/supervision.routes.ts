
import { Router } from 'express';
import { analyzeImage } from '../controllers/supervision.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/analyze', protect, analyzeImage);
// Session management routes (start, stop, break) can be added here
// For simplicity, we can infer start/stop from the first/last analysis call of a day
// or create explicit endpoints.

export default router;