import { Router } from 'express';
import { getDashboardStats, getAllUsersTokenStats, getFeedbacks, updateFeedbackStatus } from '../controllers/admin.controller';

const router = Router();

// 管理员认证中间件
const adminAuth = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'];
  
  // 从环境变量获取管理员密钥，如果没有设置则使用默认值
  const validAdminKey = process.env.ADMIN_KEY || 'admin123456';
  
  if (adminKey !== validAdminKey) {
    return res.status(401).json({ message: '未授权访问' });
  }
  
  next();
};

// 数据看板统计
router.get('/dashboard/stats', adminAuth, getDashboardStats);

// 用户token统计
router.get('/users/token-stats', adminAuth, getAllUsersTokenStats);

// 用户反馈管理
router.get('/feedback', adminAuth, getFeedbacks);
router.put('/feedback/:id', adminAuth, updateFeedbackStatus);

export default router;