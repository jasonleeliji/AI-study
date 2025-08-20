import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import routes from './routes';
import configManagerRoutes from './routes/configManager.routes';
import audioManagerRoutes from './routes/audioManager.routes';
import imageManagerRoutes from './routes/imageManager.routes';
import configManagerService from './services/configManager.service';

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 提供语音文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 静态文件服务 - 提供前端构建后的文件访问
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API路由
app.use('/api', routes);
app.use('/api/admin/config-manager', configManagerRoutes);
app.use('/api/admin/audio-manager', audioManagerRoutes);
app.use('/api/admin/image-manager', imageManagerRoutes);

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 处理前端路由 (SPA应用需要)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 初始化默认配置数据的函数
export const initializeConfigs = async () => {
    try {
        console.log('Initializing default configurations...');
        await configManagerService.initializeDefaultConfigs();
        console.log('Default configurations initialized successfully');
    } catch (error) {
        console.error('Failed to initialize configurations:', error);
        throw error;
    }
};

export default app;