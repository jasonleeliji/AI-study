import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import configManagerService from '../services/configManager.service';

// 扩展Request接口以支持文件上传
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadPath = path.join(__dirname, '../../uploads/audio');
    // 确保目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: any, file: any, cb: any) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许音频文件
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传音频文件'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

/**
 * 上传语音文件
 */
export const uploadAudio = [
  upload.single('audio'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        return res.status(400).json({ message: '请选择要上传的语音文件' });
      }

      const audioUrl = `/uploads/audio/${multerReq.file.filename}`;
      
      res.json({
        message: '语音文件上传成功',
        audioUrl,
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
 * 删除语音文件
 */
export const deleteAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/audio', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: '语音文件删除成功' });
    } else {
      res.status(404).json({ message: '文件不存在' });
    }
  } catch (error: any) {
    console.error('删除语音文件失败:', error);
    res.status(500).json({ message: '删除失败', error: error.message });
  }
};

/**
 * 批量上传语音文件
 */
export const uploadMultipleAudio = [
  upload.array('audios', 10), // 最多10个文件
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const multerReq = req as MulterRequest;
      const files = multerReq.files as any[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: '请选择要上传的语音文件' });
      }

      const uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        audioUrl: `/uploads/audio/${file.filename}`
      }));

      res.json({
        message: `成功上传${uploadedFiles.length}个语音文件`,
        files: uploadedFiles
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * 更新反馈消息的语音文件
 */
export const updateFeedbackAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { feedbackId, messageIndex, audioUrl } = req.body;
    
    // 获取反馈消息
    const feedbackMessage = await configManagerService.getFeedbackMessageById(feedbackId);
    if (!feedbackMessage) {
      return res.status(404).json({ message: '反馈消息不存在' });
    }

    let audioUrls = feedbackMessage.audioUrls || [];

    // 扩展数组长度以匹配messages
    while (audioUrls.length < feedbackMessage.messages.length) {
      audioUrls.push('');
    }

    // 更新指定索引的语音URL
    if (messageIndex >= 0 && messageIndex < feedbackMessage.messages.length) {
      audioUrls[messageIndex] = audioUrl || '';
      
      await feedbackMessage.update({ audioUrls });
      
      res.json({
        message: '语音文件更新成功',
        feedbackMessage
      });
    } else {
      res.status(400).json({ message: '消息索引无效' });
    }
  } catch (error: any) {
    console.error('更新反馈消息语音失败:', error);
    res.status(500).json({ message: '更新失败', error: error.message });
  }
};