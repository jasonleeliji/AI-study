
import { Router } from 'express';
import { startSession, stopSession, getCurrentSession, startBreak, resumeFromBreak } from '../controllers/session.controller';
import { protect } from '../middleware/auth.middleware';
import { checkDailyTimeLimit } from '../middleware/timeLimit.middleware';

const router = Router();

router.post('/start', protect, checkDailyTimeLimit, startSession);
router.post('/stop', protect, stopSession);
router.get('/current', protect, getCurrentSession);
router.post('/break', protect, startBreak);
router.post('/resume', protect, resumeFromBreak);

export default router;
