import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// OSS签名接口
export interface OssSignature {
  policy: string;
  signature: string;
  accessKeyId: string;
  host: string;
  key: string;
  expire: number;
}

// Multer配置选项接口
export interface MulterOptions {
  destination: string;
  fileFilter?: (req: any, file: any, cb: any) => void;
  limits?: {
    fileSize?: number;
  };
  filenamePrefix?: string;
}

// 上传策略类型
export type UploadStrategy = 'local' | 'oss';

// 上传配置接口
export interface UploadConfig {
  strategy: UploadStrategy;
  ossHost?: string;
}

class UploadService {
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * 获取当前上传策略配置
   */
  getUploadConfig(): UploadConfig {
    if (this.isProduction()) {
      return {
        strategy: 'oss',
        ossHost: process.env.OSS_HOST || 'https://your-bucket.oss-cn-shanghai.aliyuncs.com'
      };
    } else {
      return {
        strategy: 'local'
      };
    }
  }

  /**
   * 生成OSS上传签名 (仅在生产模式下有效)
   */
  async getUploadSignature(filename: string): Promise<OssSignature> {
    if (!this.isProduction()) {
      throw new Error('OSS upload signature is only available in production mode');
    }

    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.OSS_BUCKET;
    const region = process.env.OSS_REGION || 'oss-cn-shanghai';

    if (!accessKeyId || !accessKeySecret || !bucket) {
      throw new Error('OSS configuration is incomplete. Please check OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, and OSS_BUCKET environment variables.');
    }

    const host = `https://${bucket}.${region}.aliyuncs.com`;
    const expire = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
    const key = `uploads/${Date.now()}-${filename}`;

    // 构建Policy
    const policy = {
      expiration: new Date(expire * 1000).toISOString(),
      conditions: [
        { bucket },
        ['starts-with', '$key', 'uploads/'],
        ['content-length-range', 0, 10485760] // 10MB限制
      ]
    };

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(policyBase64)
      .digest('base64');

    return {
      policy: policyBase64,
      signature,
      accessKeyId,
      host,
      key,
      expire
    };
  }

  /**
   * 获取本地上传中间件 (仅在开发模式下有效)
   */
  getLocalUploadMiddleware(options: MulterOptions): multer.Multer {
    if (this.isProduction()) {
      throw new Error('Local upload middleware is only available in development mode');
    }

    // 确保上传目录存在
    const uploadPath = path.join(__dirname, '../../uploads', options.destination);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        cb(null, uploadPath);
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = options.filenamePrefix || 'file';
        cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    return multer({
      storage,
      fileFilter: options.fileFilter,
      limits: options.limits
    });
  }

  /**
   * 生成完整的文件URL
   */
  generateFileUrl(filename: string, type: 'image' | 'audio'): string {
    if (this.isProduction()) {
      const ossHost = process.env.OSS_HOST || 'https://your-bucket.oss-cn-shanghai.aliyuncs.com';
      return `${ossHost}/uploads/${filename}`;
    } else {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      return `${baseUrl}/uploads/${type}s/${filename}`;
    }
  }

  /**
   * 获取图片文件过滤器
   */
  getImageFileFilter() {
    return (req: any, file: any, cb: any) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('只允许上传图片文件'), false);
      }
    };
  }

  /**
   * 获取音频文件过滤器
   */
  getAudioFileFilter() {
    return (req: any, file: any, cb: any) => {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('只允许上传音频文件'), false);
      }
    };
  }

  /**
   * 删除本地文件
   */
  deleteLocalFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }
}

export default new UploadService();