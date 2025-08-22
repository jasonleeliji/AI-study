import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import configManagerService from '../services/configManager.service';
import uploadService from '../services/upload.service';

// 扩展Request接口以支持文件上传
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// 获取本地上传中间件（仅在开发模式下使用）
const getLocalUploadMiddleware = () => {
  return uploadService.getLocalUploadMiddleware({
    destination: 'audio',
    fileFilter: uploadService.getAudioFileFilter(),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB限制
    },
    filenamePrefix: 'audio'
  });
};

/**
 * 获取音频上传签名（OSS模式）
 * GET /api/audio/signature
 */
export const getAudioUploadSignature = async (req: Request, res: Response, next: NextFunction) => {
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
 * 保存音频文件URL（OSS模式）
 * POST /api/audio/save-url
 */
export const saveAudioUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioUrl, originalName, size } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ message: '音频URL是必需的' });
    }

    const filename = path.basename(audioUrl);
    
    res.json({
      message: '音频文件URL保存成功',
      audioUrl,
      filename,
      originalName: originalName || filename,
      size: size || 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 上传语音文件（本地模式）
 */
export const uploadAudio = [
  (req: Request, res: Response, next: NextFunction) => {
    const config = uploadService.getUploadConfig();
    if (config.strategy === 'oss') {
      return res.status(400).json({ 
        message: '当前为OSS模式，请使用OSS上传流程',
        strategy: 'oss'
      });
    }
    
    const upload = getLocalUploadMiddleware();
    upload.single('audio')(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        return res.status(400).json({ message: '请选择要上传的语音文件' });
      }

      const audioUrl = uploadService.generateFileUrl(multerReq.file.filename, 'audio');
      
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
 * 批量保存音频文件URL（OSS模式）
 * POST /api/audio/save-multiple-urls
 */
export const saveMultipleAudioUrls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioFiles } = req.body;
    
    if (!audioFiles || !Array.isArray(audioFiles) || audioFiles.length === 0) {
      return res.status(400).json({ message: '音频文件列表是必需的' });
    }

    const savedFiles = audioFiles.map(file => ({
      filename: path.basename(file.audioUrl),
      originalName: file.originalName || path.basename(file.audioUrl),
      size: file.size || 0,
      audioUrl: file.audioUrl
    }));

    res.json({
      message: `成功保存${savedFiles.length}个音频文件URL`,
      files: savedFiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量上传语音文件（本地模式）
 */
export const uploadMultipleAudio = [
  (req: Request, res: Response, next: NextFunction) => {
    const config = uploadService.getUploadConfig();
    if (config.strategy === 'oss') {
      return res.status(400).json({ 
        message: '当前为OSS模式，请使用OSS上传流程',
        strategy: 'oss'
      });
    }
    
    const upload = getLocalUploadMiddleware();
    upload.array('audios', 10)(req, res, next); // 最多10个文件
  },
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
        audioUrl: uploadService.generateFileUrl(file.filename, 'audio')
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