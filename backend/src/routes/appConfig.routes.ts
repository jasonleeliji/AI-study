import { Router } from 'express';
import { getAppConfig, updateAppConfig, getPlanDetailsController, getUITextConfig } from '../controllers/appConfig.controller';
import { protect } from '../middleware/auth.middleware';

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

// Public route to get config (e.g., for frontend to display plans)
router.get('/', getAppConfig);

// Public route to get plan details with current pricing
router.get('/plan-details', getPlanDetailsController);

// Public route to get UI text configuration based on subscription plan
router.get('/ui-text', getUITextConfig);

// Protected admin route to update config - use admin key authentication
router.put('/', adminAuth, updateAppConfig);

export default router;
