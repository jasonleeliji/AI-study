import { Router } from 'express';
import { uploadAudio, uploadMultipleAudio, deleteAudio, updateFeedbackAudio } from '../controllers/audioManager.controller';
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

const router = Router();

// 上传单个语音文件
router.post('/upload', adminAuth, uploadAudio);

// 批量上传语音文件
router.post('/upload-multiple', adminAuth, uploadMultipleAudio);

// 删除语音文件
router.delete('/:filename', adminAuth, deleteAudio);

// 更新反馈消息的语音文件
router.post('/update-feedback-audio', adminAuth, updateFeedbackAudio);

export default router;