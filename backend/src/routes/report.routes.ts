
import { Router } from 'express';
import { getReport, deleteAllReports } from '../controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// 删除所有报告数据
router.delete('/all', protect, deleteAllReports);

// e.g., /api/reports/daily, /api/reports/weekly
router.get('/:period', protect, getReport);

export default router;
