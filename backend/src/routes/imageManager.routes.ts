import { Router } from 'express';
import { 
  uploadWechatQrImage, 
  getWechatQrImage, 
  resetWechatQrImage,
  getImageUploadSignature,
  saveWechatQrImageUrl
} from '../controllers/imageManager.controller';

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

// 上传微信二维码图片（本地模式）
router.post('/upload-wechat-qr', adminAuth, uploadWechatQrImage);

// 获取图片上传签名（OSS模式）
router.get('/signature', adminAuth, getImageUploadSignature);

// 保存微信二维码图片URL（OSS模式）
router.post('/wechat-qr-url', adminAuth, saveWechatQrImageUrl);

// 获取当前微信二维码图片URL
router.get('/wechat-qr', getWechatQrImage);

// 重置为默认二维码图片
router.post('/reset-wechat-qr', adminAuth, resetWechatQrImage);

export default router;