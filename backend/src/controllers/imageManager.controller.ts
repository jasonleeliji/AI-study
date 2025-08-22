import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppConfig } from '../models';
import uploadService from '../services/upload.service';

// 扩展Request接口以支持文件上传
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 获取本地上传中间件（仅在开发模式下使用）
const getLocalUploadMiddleware = () => {
  return uploadService.getLocalUploadMiddleware({
    destination: 'images',
    fileFilter: uploadService.getImageFileFilter(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    filenamePrefix: 'qr'
  });
};

/**
 * 获取图片上传签名（OSS模式）
 * GET /api/images/signature
 */
export const getImageUploadSignature = async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * 保存微信二维码图片URL（OSS模式）
 * POST /api/images/wechat-qr-url
 */
export const saveWechatQrImageUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: '图片URL是必需的' });
    }

    // 更新应用配置中的二维码图片URL
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({ wechatQrImageUrl: imageUrl });
    } else {
      await config.update({ wechatQrImageUrl: imageUrl });
    }
    
    res.json({
      message: '微信二维码图片URL保存成功',
      imageUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 上传微信二维码图片并更新配置（本地模式）
 */
export const uploadWechatQrImage = [
  (req: Request, res: Response, next: NextFunction) => {
    const config = uploadService.getUploadConfig();
    if (config.strategy === 'oss') {
      return res.status(400).json({ 
        message: '当前为OSS模式，请使用OSS上传流程',
        strategy: 'oss'
      });
    }
    
    const upload = getLocalUploadMiddleware();
    upload.single('image')(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        return res.status(400).json({ message: '请选择要上传的图片文件' });
      }

      const imageUrl = uploadService.generateFileUrl(multerReq.file.filename, 'image');
      
      // 更新应用配置中的二维码图片URL
      let config = await AppConfig.findOne();
      if (!config) {
        config = await AppConfig.create({ wechatQrImageUrl: imageUrl });
      } else {
        // 如果之前有上传的图片，删除旧文件（但保留默认图片）
        if (config.wechatQrImageUrl && 
            config.wechatQrImageUrl !== '/src/assets/wechat-w.png' && 
            config.wechatQrImageUrl.includes('/uploads/images/')) {
          const filename = path.basename(config.wechatQrImageUrl);
          const oldFilePath = path.join(__dirname, '../../uploads/images', filename);
          uploadService.deleteLocalFile(oldFilePath);
        }
        // 更新配置
        await config.update({ wechatQrImageUrl: imageUrl });
      }
      
      res.json({
        message: '微信二维码图片上传成功',
        imageUrl,
        filename: multerReq.file.filename,
        originalName: multerReq.file.originalname,
        size: multerReq.file.size
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * 获取当前微信二维码图片URL
 */
export const getWechatQrImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await AppConfig.findOne();
    const defaultImageUrl = uploadService.getUploadConfig().strategy === 'oss' 
      ? `${process.env.OSS_HOST || 'https://your-bucket.oss-cn-shanghai.aliyuncs.com'}/assets/wechat-w.png`
      : `${process.env.BACKEND_URL || 'http://localhost:5000'}/src/assets/wechat-w.png`;
    
    res.json({
      imageUrl: config ? config.wechatQrImageUrl : defaultImageUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 重置为默认二维码图片
 */
export const resetWechatQrImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadConfig = uploadService.getUploadConfig();
    const defaultImageUrl = uploadConfig.strategy === 'oss' 
      ? `${process.env.OSS_HOST || 'https://your-bucket.oss-cn-shanghai.aliyuncs.com'}/assets/wechat-w.png`
      : `${process.env.BACKEND_URL || 'http://localhost:5000'}/src/assets/wechat-w.png`;
    
    let config = await AppConfig.findOne();
    if (config) {
      // 如果当前使用的是上传的图片，删除本地文件（仅在本地模式下）
      if (uploadConfig.strategy === 'local' && 
          config.wechatQrImageUrl && 
          !config.wechatQrImageUrl.includes('/src/assets/') && 
          config.wechatQrImageUrl.includes('/uploads/images/')) {
        const filename = path.basename(config.wechatQrImageUrl);
        const filePath = path.join(__dirname, '../../uploads/images', filename);
        uploadService.deleteLocalFile(filePath);
      }
      
      // 重置为默认图片
      await config.update({ wechatQrImageUrl: defaultImageUrl });
    } else {
      // 如果没有配置，创建一个
      config = await AppConfig.create({ wechatQrImageUrl: defaultImageUrl });
    }
    
    res.json({
      message: '已重置为默认二维码图片',
      imageUrl: config.wechatQrImageUrl
    });
  } catch (error) {
    next(error);
  }
};