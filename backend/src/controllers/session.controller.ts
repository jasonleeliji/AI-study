import { Request, Response, NextFunction } from 'express';
import { StudySession, ChildProfile, TokenUsage, AppConfig } from '../models';
import { StudyState, CharacterRank } from '../types/character';
import { StudyStatus } from '../types/studySession';
import { AuthenticatedRequest } from '../types';
import { sendSessionUpdateToUser } from '../services/realtime.service';
import { calculateMetrics } from '../services/report.service';
import { DailyTimeLimitService } from '../services/dailyTimeLimit.service';
import config from '../config';
import { broadcastConfigUpdate } from '../services/realtime.service';
import { Op } from 'sequelize';

// 从应用配置中获取游戏化阶段目标，确保单一数据源
const getGameStageGoals = async () => {
  const appConfig = await AppConfig.findOne();
  return {
    STONE_MONKEY_GOAL_TOKENS: appConfig?.stoneMonkeyGoalTokens || 0,
    CAVE_MASTER_GOAL_TOKENS: appConfig?.caveMasterGoalTokens || 0,
    MONKEY_KING_GOAL_TOKENS: appConfig?.monkeyKingGoalTokens || 0,
    TOTAL_MONKEY_KING_GOAL_TOKENS: appConfig?.totalMonkeyKingGoalTokens || 0,
  };
};

// 时间相关常量保持从环境变量获取
const STONE_MONKEY_GOAL_SECONDS = parseInt(process.env.STONE_MONKEY_GOAL_SECONDS || '600');
const CAVE_MASTER_GOAL_SECONDS = parseInt(process.env.CAVE_MASTER_GOAL_SECONDS || '1800');
const MONKEY_KING_GOAL_SECONDS = parseInt(process.env.MONKEY_KING_GOAL_SECONDS || '3600');
const TOTAL_MONKEY_KING_GOAL_SECONDS = parseInt(process.env.TOTAL_MONKEY_KING_GOAL_SECONDS || '7200');

// Start a new study session
export const startSession = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    try {
        const existingSession = await StudySession.findOne({
            where: {
                userId,
                status: {
                    [Op.in]: [StudyStatus.Studying, StudyStatus.Break]
                }
            }
        });

        if (existingSession) {
            return (res as any).status(400).json({ message: '已存在活跃的学习会话' });
        }
        
        // Reset daily spiritual power and focus seconds if it's a new day
        const profile = await ChildProfile.findOne({ where: { userId } });
        if (profile) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if ((profile.lastFocusUpdate || new Date(0)) < today) {
                profile.dailyFocusSeconds = 0;
                profile.dailySpiritualPower = 0;
            }
            profile.lastFocusUpdate = new Date();
            await profile.save();
        }

        const now = new Date();
        const newSession = await StudySession.create({
            userId,
            startTime: now,
            status: StudyStatus.Studying,
            lastActivity: now,
            currentRank: CharacterRank.WUKONG, // Initialize with highest rank
            breakHistory: []
        });

        sendSessionUpdateToUser(userId, newSession);
        
        // 返回会话信息和剩余时间
        const response = {
            ...newSession.toJSON(),
            remainingSeconds: (authReq as any).remainingSeconds,
            dailyLimitHours: (authReq as any).dailyLimitHours
        };
        
        (res as any).status(201).json(response);
    } catch (error) {
        next(error);
    }
};

// Stop the current study session
export const stopSession = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    try {
        // Find the most recent session for the user, regardless of status
        const session = await StudySession.findOne({
            where: { userId },
            order: [['startTime', 'DESC']]
        });

        if (!session) {
            return (res as any).status(404).json({ message: '未找到任何学习会话' });
        }

        // If the session is already finished, do nothing and return success
        if (session.status === StudyStatus.Finished) {
            sendSessionUpdateToUser(userId, session);
            return (res as any).json(session);
        }

        // If the session is active, update it to finished
        const wasActive = session.status === StudyStatus.Studying || session.status === StudyStatus.Break;
        
        session.status = StudyStatus.Finished;
        session.endTime = new Date();

        // Close any open breaks
        const breakHistory = session.breakHistory || [];
        const openBreak = breakHistory.find(b => !b.endTime);
        if (openBreak) {
            openBreak.endTime = new Date();
            session.breakHistory = breakHistory;
        }

        await session.save();
        
        // Only update metrics if the session was actually active before this call
        if (wasActive) {
            const profile = await ChildProfile.findOne({ where: { userId } });
            if (profile) {
                const metrics = calculateMetrics([session]);
                profile.dailyFocusSeconds = (profile.dailyFocusSeconds || 0) + metrics.focusedTime;
                profile.totalFocusSeconds = (profile.totalFocusSeconds || 0) + metrics.focusedTime;
                profile.lastFocusUpdate = new Date();

                // 获取该会话期间专注状态下消耗的token总数作为灵力值
                const sessionTokenUsage = await TokenUsage.sum('totalTokens', {
                    where: {
                        userId: profile.userId,
                        sessionId: session.id,
                        isFocused: true
                    }
                });

                const sessionSpiritualPower = sessionTokenUsage || 0;
                profile.dailySpiritualPower = (profile.dailySpiritualPower || 0) + sessionSpiritualPower;
                profile.totalSpiritualPower = (profile.totalSpiritualPower || 0) + sessionSpiritualPower;

                // 基于灵力值的游戏化阶段升级逻辑
                const oldStage = profile.gamificationStage;
                const stageGoals = await getGameStageGoals();
                if (profile.gamificationStage === 'STONE_MONKEY' && (profile.totalSpiritualPower || 0) >= stageGoals.STONE_MONKEY_GOAL_TOKENS) {
                    profile.gamificationStage = 'CAVE_MASTER';
                } else if (profile.gamificationStage === 'CAVE_MASTER' && (profile.totalSpiritualPower || 0) >= stageGoals.CAVE_MASTER_GOAL_TOKENS) {
                    profile.gamificationStage = 'MONKEY_KING';
                } else if (profile.gamificationStage === 'MONKEY_KING' && (profile.totalSpiritualPower || 0) >= stageGoals.MONKEY_KING_GOAL_TOKENS) {
                    profile.gamificationStage = 'TOTAL_MONKEY_KING';
                }
                await profile.save();
                
                // 如果游戏化阶段发生变化，通过WebSocket通知前端
                if (oldStage !== profile.gamificationStage) {
                    const { sendProfileUpdateToUser } = require('../services/realtime.service');
                    sendProfileUpdateToUser(userId, profile);
                }
                
                await DailyTimeLimitService.decreaseRemainingSeconds(userId, metrics.focusedTime);
            }
        }

        sendSessionUpdateToUser(userId, session);
        (res as any).json(session);
    } catch (err) {
        next(err);
    }
};

// Start a break
export const startBreak = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { type } = (req as any).body;

    if (!type) {
        return (res as any).status(400).json({ message: '休息类型是必需的' });
    }

    try {
        const session = await StudySession.findOne({
            where: {
                userId,
                status: StudyStatus.Studying
            }
        });

        if (!session) {
            return (res as any).status(404).json({ message: '未找到正在学习的会话以开始休息' });
        }

        session.status = StudyStatus.Break;
        session.activeBreakType = type;
        session.lastActivity = new Date();
        session.breakHistory = [...(session.breakHistory || []), { startTime: new Date(), type }];
        
        await session.save();

        sendSessionUpdateToUser(userId, session);
        (res as any).json(session);
    } catch (error) {
        next(error);
    }
};

// Resume from a break
export const resumeFromBreak = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    try {
        const session = await StudySession.findOne({
            where: {
                userId,
                status: StudyStatus.Break
            }
        });

        if (!session) {
            return (res as any).status(404).json({ message: '未找到正在休息的会话以恢复学习' });
        }

        session.status = StudyStatus.Studying;
        session.activeBreakType = undefined;
        session.lastActivity = new Date();
        await session.save();

        sendSessionUpdateToUser(userId, session);
        (res as any).json(session);
    } catch (error) {
        next(error);
    }
};

// Get the current or most recent session
export const getCurrentSession = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    try {
        // 只返回活动的session（STUDYING或BREAK状态）
        const session = await StudySession.findOne({ 
            where: { 
                userId: authReq.user!.id,
                status: {
                    [Op.in]: [StudyStatus.Studying, StudyStatus.Break]
                }
            },
            order: [['createdAt', 'DESC']]
        });
        (res as any).json(session); // Will return null if no active sessions exist
    } catch (error) {
        next(error);
    }
};
