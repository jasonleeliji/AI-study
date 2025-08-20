import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, PLAN_DETAILS, TRIAL_DAILY_LIMIT } from '../types';
import { User, StudySession, Subscription } from '../models';
import { StudyState } from '../types/character';
import { calculateMetrics } from '../services/report.service';
import { Op } from 'sequelize';

export const checkDailyTimeLimit = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    try {
        // 获取用户订阅信息
        const user = await User.findByPk(userId, { include: [{ model: Subscription, as: 'subscription' }] });
        if (!user) {
            return (res as any).status(404).json({ message: '用户未找到' });
        }

        const sub = user.subscription;
        const now = new Date();
        const hasActiveSubscription = sub && sub.status === 'active' && sub.endDate && sub.endDate > now;
        const isTrialActive = user.trialEndDate && user.trialEndDate > now;

        // 确定用户的每日时间限制
        let dailyLimitHours = 0;
        if (hasActiveSubscription && sub) {
            const planDetails = PLAN_DETAILS[sub.plan as keyof typeof PLAN_DETAILS];
            dailyLimitHours = planDetails.dailyTimeLimit;
        } else if (isTrialActive) {
            dailyLimitHours = TRIAL_DAILY_LIMIT;
        } else {
            return (res as any).status(403).json({ 
                message: '您的试用期已结束，请订阅计划以继续使用。',
                code: 'TRIAL_EXPIRED'
            });
        }

        // 获取今日已使用的学习时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaySessions = await StudySession.findAll({
            where: {
                userId: userId,
                startTime: { [Op.gte]: today, [Op.lt]: tomorrow },
                status: StudyState.Finished
            }
        });

        // 计算今日已使用时间（秒）
        const todayUsedSeconds = todaySessions.reduce((total, session) => {
            const metrics = calculateMetrics([session]);
            return total + metrics.focusedTime;
        }, 0);

        const dailyLimitSeconds = dailyLimitHours * 3600; // 转换为秒
        const remainingSeconds = dailyLimitSeconds - todayUsedSeconds;

        if (remainingSeconds <= 0) {
            return (res as any).status(403).json({ 
                message: `您今日的学习时间已达到${dailyLimitHours}小时上限，请明天再来。`,
                code: 'DAILY_LIMIT_EXCEEDED',
                dailyLimitHours,
                usedHours: Math.round(todayUsedSeconds / 3600 * 100) / 100
            });
        }

        // 将剩余时间信息添加到请求对象中，供后续使用
        (authReq as any).remainingSeconds = remainingSeconds;
        (authReq as any).dailyLimitHours = dailyLimitHours;

        next();
    } catch (error) {
        next(error);
    }
};