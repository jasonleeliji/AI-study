import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Application } from 'express';
import url from 'url';
import jwt from 'jsonwebtoken';
import config from '../config';
import { StudySession } from '../models/studySession.model';
import { StudyStatus } from '../types/studySession';
import { TokenUsage } from '../services/qwen.service';
import { DailyTimeLimitService } from './dailyTimeLimit.service';
import { checkAndHandleForcedBreak } from './forcedBreak.service';
import { Op } from 'sequelize';

const userSockets = new Map<string, WebSocket[]>();
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const initRealtimeService = (app: Application): HttpServer => {
    const server = createServer(app as any);
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const token = url.parse(req.url!, true).query.token as string;
        if (!token) {
            ws.terminate();
            return;
        }

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
            const userId = decoded.id;

            if (!userSockets.has(userId)) {
                userSockets.set(userId, []);
            }
            userSockets.get(userId)!.push(ws);

            console.log(`WebSocket connected for user: ${userId}`);

            ws.on('close', () => {
                const sockets = userSockets.get(userId) || [];
                const index = sockets.indexOf(ws);
                if (index > -1) {
                    sockets.splice(index, 1);
                }
                if (sockets.length === 0) {
                    userSockets.delete(userId);
                }
                console.log(`WebSocket disconnected for user: ${userId}`);
            });
            
            ws.on('error', (error) => {
                console.error(`WebSocket error for user ${userId}:`, error);
            });

        } catch (error) {
            console.error('WebSocket connection failed: Invalid token');
            ws.terminate();
        }
    });

    return server;
};

export const sendSessionUpdateToUser = (userId: string, session: StudySession | null, tokenUsage?: TokenUsage): void => {
    const sockets = userSockets.get(userId);
    if (sockets) {
        const payload = JSON.stringify({
            type: 'session_updated',
            session,
            tokenUsage
        });
        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    }
};

export const sendRemainingTimeUpdateToUser = (userId: string, remainingSeconds: number): void => {
    const sockets = userSockets.get(userId);
    if (sockets) {
        const payload = JSON.stringify({
            type: 'remaining_time_updated',
            remainingSeconds
        });
        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    }
};

export const sendForcedBreakNotificationToUser = (userId: string, breakData: any): void => {
    const sockets = userSockets.get(userId);
    if (sockets) {
        const payload = JSON.stringify({
            type: 'forced_break_notification',
            breakData
        });
        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    }
};

export const sendProfileUpdateToUser = (userId: string, profile: any): void => {
    const sockets = userSockets.get(userId);
    if (sockets) {
        const payload = JSON.stringify({
            type: 'profile_updated',
            profile
        });
        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    }
};

export const broadcastConfigUpdate = (config: any): void => {
    // 确保配置中包含分析间隔信息
    if (config && !config.analysisIntervalSeconds) {
        console.log('配置中缺少分析间隔信息，尝试从AI提示词配置中获取');
        // 不阻塞广播流程，仍然发送现有配置
    }
    
    const payload = JSON.stringify({
        type: 'config_updated',
        config
    });
    
    // 广播给所有连接的用户
    userSockets.forEach((sockets, userId) => {
        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
    });
    
    console.log('配置更新已广播给所有连接的用户，配置内容:', JSON.stringify(config));
};

export const updateRemainingTimeForActiveUsers = async (): Promise<void> => {
    try {
        // 获取所有活跃的修行会话
        const activeSessions = await StudySession.findAll({
            where: {
                status: StudyStatus.Studying
            }
        });

        for (const session of activeSessions) {
            const userId = session.userId;
            
            // 减少1秒的剩余时间
            const remainingSeconds = await DailyTimeLimitService.decreaseRemainingSeconds(userId.toString(), 1);
            
            // 发送剩余时间更新
            sendRemainingTimeUpdateToUser(userId.toString(), remainingSeconds);
            
            // 如果时间用完，结束会话
            if (remainingSeconds <= 0) {
                session.status = StudyStatus.Finished;
                session.endTime = new Date();
                
                // 关闭任何开放的休息
                const openBreak = session.breakHistory?.find(b => !b.endTime);
                if (openBreak) {
                    openBreak.endTime = new Date();
                }
                
                await session.save();
                sendSessionUpdateToUser(userId.toString(), session);
                console.log(`Session ${session.id} ended due to time limit for user ${userId}`);
            }
        }
        
        // 检查强制休息
        await checkAndHandleForcedBreak();
    } catch (error) {
        console.error('Error updating remaining time for active users:', error);
    }
};

export const checkStaleSessions = async (): Promise<void> => {
    const timeoutThreshold = new Date(Date.now() - INACTIVITY_TIMEOUT_MS);
    try {
        const staleSessions = await StudySession.findAll({
            where: {
                status: {
                    [Op.in]: [StudyStatus.Studying, StudyStatus.Break]
                },
                lastActivity: {
                    [Op.lt]: timeoutThreshold
                }
            }
        });

        if (staleSessions.length > 0) {
            console.log(`Found ${staleSessions.length} stale session(s) to terminate.`);
        }

        for (const session of staleSessions) {
            const lastActivityTime = session.lastActivity || new Date(); // Fallback
            session.status = StudyStatus.Finished;
            session.endTime = lastActivityTime;
            
            // Close any open breaks
            const openBreak = session.breakHistory?.find(b => !b.endTime);
            if(openBreak) {
                openBreak.endTime = lastActivityTime;
            }

            await session.save();
            console.log(`Terminated stale session ${session.id} for user ${session.userId}`);
            
            // Notify user if they are still somehow connected
            sendSessionUpdateToUser(session.userId.toString(), session);
        }
    } catch (error) {
        console.error('Error checking for stale sessions:', error);
    }
};
