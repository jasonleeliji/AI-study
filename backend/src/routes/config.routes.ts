import { Router } from 'express';
import {
  // App config
  getAppConfig,
  updateAppConfig,
  getPlanDetailsController,
  getUITextConfig,
  // AI提示词配置
  getAiPromptConfigs,
  getAiPromptConfig,
  upsertAiPromptConfig,
  deleteAiPromptConfig,
  // 反馈消息配置
  getFeedbackMessages,
  getFeedbackMessage,
  upsertFeedbackMessage,
  deleteFeedbackMessage,
  initializeFeedbackMessages
} from '../controllers/config.controller';

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

// ==================== Public Routes ====================
// Public route to get config (e.g., for frontend to display plans)
router.get('/', getAppConfig);

// Public route to get plan details with current pricing
router.get('/plan-details', getPlanDetailsController);

// Public route to get UI text configuration based on subscription plan
router.get('/ui-text', getUITextConfig);


// ==================== Admin Routes ====================

// Protected admin route to update config - use admin key authentication
router.put('/', adminAuth, updateAppConfig);

// ==================== AI提示词配置路由 ====================
router.get('/ai-prompts', adminAuth, getAiPromptConfigs);
router.get('/ai-prompts/:subscriptionPlan', adminAuth, getAiPromptConfig);
router.post('/ai-prompts', adminAuth, upsertAiPromptConfig);
router.put('/ai-prompts', adminAuth, upsertAiPromptConfig);
router.delete('/ai-prompts/:id', adminAuth, deleteAiPromptConfig);

// ==================== 反馈消息配置路由 ====================
router.get('/feedback-messages', adminAuth, getFeedbackMessages);
router.get('/feedback-message', adminAuth, getFeedbackMessage);
router.post('/feedback-messages', adminAuth, upsertFeedbackMessage);
router.put('/feedback-messages', adminAuth, upsertFeedbackMessage);
router.delete('/feedback-messages/:id', adminAuth, deleteFeedbackMessage);
router.post('/feedback-messages/initialize', adminAuth, initializeFeedbackMessages);

export default router;