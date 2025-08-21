import { StudySession } from '../models/studySession.model';
import { ChildProfile } from '../models/childProfile.model';
import { StudyStatus } from '../types/studySession';
import { sendSessionUpdateToUser, sendForcedBreakNotificationToUser } from './realtime.service';
import { Op } from 'sequelize';

// 存储用户连续学习开始时间
const userContinuousStudyStartTime = new Map<string, Date>();

// 发送强制休息通知
export const sendForcedBreakNotification = (userId: string, profile: any): void => {
    // 这里可以集成语音提醒服务
    console.log(`强制休息提醒: 用户 ${userId} 已连续学习 ${profile.workDurationBeforeForcedBreak} 分钟，需要休息 ${profile.forcedBreakDuration} 分钟`);
    
    // 发送WebSocket通知到前端
    const breakData = {
        message: `您已连续学习 ${profile.workDurationBeforeForcedBreak} 分钟，系统将强制进入休息模式，请休息 ${profile.forcedBreakDuration} 分钟后再继续学习。`,
        workDuration: profile.workDurationBeforeForcedBreak,
        breakDuration: profile.forcedBreakDuration,
        isForced: true,
        timestamp: new Date().toISOString()
    };
    
    // 通过WebSocket发送到前端
    sendForcedBreakNotificationToUser(userId, breakData);
};

// 检查并处理强制休息
export const checkAndHandleForcedBreak = async (): Promise<void> => {
    try {
        // 获取所有正在学习的会话
        const activeSessions = await StudySession.findAll({
            where: {
                status: StudyStatus.Studying
            }
        });

        for (const session of activeSessions) {
            const userId = session.userId.toString();
            
            // 获取用户配置
            const profile = await ChildProfile.findOne({
                where: { userId: session.userId }
            });
            
            if (!profile) continue;

            const workDurationMinutes = profile.workDurationBeforeForcedBreak || 60;
            const breakDurationMinutes = profile.forcedBreakDuration || 10;
            
            // 检查是否有连续学习开始时间记录
            if (!userContinuousStudyStartTime.has(userId)) {
                // 如果没有记录，说明是新开始的学习会话
                userContinuousStudyStartTime.set(userId, session.startTime);
                continue;
            }

            const studyStartTime = userContinuousStudyStartTime.get(userId)!;
            const currentTime = new Date();
            const studyDurationMinutes = (currentTime.getTime() - studyStartTime.getTime()) / (1000 * 60);

            // 如果连续学习时间超过设定值，强制进入休息
            if (studyDurationMinutes >= workDurationMinutes) {
                console.log(`用户 ${userId} 连续学习 ${studyDurationMinutes.toFixed(1)} 分钟，触发强制休息`);
                
                // 发送强制休息通知
                sendForcedBreakNotification(userId, profile);
                
                // 强制进入休息状态
                session.status = StudyStatus.Break;
                session.activeBreakType = 'forced';
                
                // 添加休息记录
                const breakHistory = session.breakHistory || [];
                breakHistory.push({
                    startTime: currentTime,
                    type: 'forced'
                });
                session.breakHistory = breakHistory;
                
                await session.save();
                
                // 发送会话更新
                sendSessionUpdateToUser(userId, session);
                
                // 重置连续学习开始时间
                userContinuousStudyStartTime.delete(userId);
                
                // 设置强制休息结束时间
                setTimeout(async () => {
                    await handleForcedBreakEnd(userId, session.id);
                }, breakDurationMinutes * 60 * 1000);
            }
        }
    } catch (error) {
        console.error('检查强制休息时出错:', error);
    }
};

// 处理强制休息结束
const handleForcedBreakEnd = async (userId: string, sessionId: number): Promise<void> => {
    try {
        const session = await StudySession.findByPk(sessionId);
        if (!session || session.status !== StudyStatus.Break || session.activeBreakType !== 'forced') {
            return;
        }

        // 结束强制休息
        const breakHistory = session.breakHistory || [];
        const currentBreak = breakHistory.find(b => !b.endTime && b.type === 'forced');
        if (currentBreak) {
            currentBreak.endTime = new Date();
        }
        
        session.status = StudyStatus.Studying;
        session.activeBreakType = undefined;
        session.breakHistory = breakHistory;
        
        await session.save();
        
        // 重新开始计算连续学习时间
        userContinuousStudyStartTime.set(userId, new Date());
        
        // 发送会话更新
        sendSessionUpdateToUser(userId, session);
        
        console.log(`用户 ${userId} 强制休息结束，恢复学习`);
    } catch (error) {
        console.error('处理强制休息结束时出错:', error);
    }
};

// 当用户开始新的学习会话时调用
export const onStudySessionStart = (userId: string): void => {
    userContinuousStudyStartTime.set(userId, new Date());
};

// 当用户结束学习会话时调用
export const onStudySessionEnd = (userId: string): void => {
    userContinuousStudyStartTime.delete(userId);
};

// 当用户主动休息时调用（重置连续学习时间）
export const onUserBreak = (userId: string): void => {
    userContinuousStudyStartTime.delete(userId);
};

// 当用户从休息恢复时调用
export const onUserResumeFromBreak = (userId: string): void => {
    userContinuousStudyStartTime.set(userId, new Date());
};