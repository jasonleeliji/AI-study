import { Router } from 'express';
import {
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
} from '../controllers/configManager.controller';

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

// ==================== AI提示词配置路由 ====================
router.get('/ai-prompts', getAiPromptConfigs);
router.get('/ai-prompts/:subscriptionPlan', getAiPromptConfig);
router.post('/ai-prompts', upsertAiPromptConfig);
router.put('/ai-prompts', upsertAiPromptConfig);
router.delete('/ai-prompts/:id', deleteAiPromptConfig);

// ==================== 反馈消息配置路由 ====================
router.get('/feedback-messages', getFeedbackMessages);
router.get('/feedback-message', getFeedbackMessage);
router.post('/feedback-messages', upsertFeedbackMessage);
router.put('/feedback-messages', upsertFeedbackMessage);
router.delete('/feedback-messages/:id', deleteFeedbackMessage);
router.post('/feedback-messages/initialize', initializeFeedbackMessages);

export default router;