import { Request, Response, NextFunction } from 'express';
import uploadService from '../services/upload.service';

/**
 * 获取上传配置
 * GET /api/config/upload
 */
export const getUploadConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = uploadService.getUploadConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取OSS上传签名
 * GET /api/upload/signature
 */
export const getOssSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.query;
    
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ message: '文件名参数是必需的' });
    }

    const signature = await uploadService.getUploadSignature(filename);
    res.json(signature);
  } catch (error) {
    if (error instanceof Error && error.message.includes('only available in production mode')) {
      return res.status(400).json({ message: 'OSS上传签名仅在生产环境下可用' });
    }
    next(error);
  }
};