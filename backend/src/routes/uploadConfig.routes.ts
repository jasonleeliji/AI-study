import { Router } from 'express';
import { getUploadConfig, getOssSignature } from '../controllers/uploadConfig.controller';

const router = Router();

// 获取上传配置
router.get('/upload', getUploadConfig);

// 获取OSS上传签名
router.get('/upload/signature', getOssSignature);

export default router;