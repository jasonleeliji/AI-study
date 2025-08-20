import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppConfig } from '../models';

// 扩展Request接口以支持文件上传
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 配置multer用于图片上传
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadPath = path.join(__dirname, '../../uploads/images');
    // 确保目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: any, file: any, cb: any) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许图片文件
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

/**
 * 上传微信二维码图片并更新配置
 */
export const uploadWechatQrImage = [
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        return res.status(400).json({ message: '请选择要上传的图片文件' });
      }

      const imageUrl = `/uploads/images/${multerReq.file.filename}`;
      
      // 更新应用配置中的二维码图片URL
      let config = await AppConfig.findOne();
      if (!config) {
        config = await AppConfig.create({ wechatQrImageUrl: imageUrl });
      } else {
        // 如果之前有上传的图片，删除旧文件（但保留默认图片）
        if (config.wechatQrImageUrl && 
            config.wechatQrImageUrl !== '/src/assets/wechat-w.png' && 
            config.wechatQrImageUrl.startsWith('/uploads/images/')) {
          const oldFilePath = path.join(__dirname, '../../', config.wechatQrImageUrl);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
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
    res.json({
      imageUrl: config ? config.wechatQrImageUrl : '/src/assets/wechat-w.png'
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
    let config = await AppConfig.findOne();
    if (config) {
      // 如果当前使用的是上传的图片，删除文件
      if (config.wechatQrImageUrl && 
          config.wechatQrImageUrl !== '/src/assets/wechat-w.png' && 
          config.wechatQrImageUrl.startsWith('/uploads/images/')) {
        const filePath = path.join(__dirname, '../../', config.wechatQrImageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // 重置为默认图片
      await config.update({ wechatQrImageUrl: '/src/assets/wechat-w.png' });
    } else {
      // 如果没有配置，创建一个
      config = await AppConfig.create({ wechatQrImageUrl: '/src/assets/wechat-w.png' });
    }
    
    res.json({
      message: '已重置为默认二维码图片',
      imageUrl: config.wechatQrImageUrl
    });
  } catch (error) {
    next(error);
  }
};