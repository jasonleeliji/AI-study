import { Router } from 'express';
import {
  getAllUsers,
  searchUserByPhone,
  updateUserSubscription,
  getUserDetails
} from '../controllers/userManager.controller';

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

// 应用管理员认证中间件到所有路由
router.use(adminAuth);

// ==================== 用户管理路由 ====================
// 获取所有用户列表（支持分页和搜索）
router.get('/users', getAllUsers);

// 根据手机号搜索用户
router.get('/users/search/:phone', searchUserByPhone);

// 获取用户详细信息
router.get('/users/:userId', getUserDetails);

// 更新用户订阅服务
router.put('/users/:userId/subscription', updateUserSubscription);

export default router;