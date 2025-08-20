import { Router } from 'express';
import { getTokenStats, getTokenHistory } from '../controllers/token.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// 获取token使用统计
router.get('/stats', protect, getTokenStats);

// 获取token使用历史
router.get('/history', protect, getTokenHistory);

export default router;