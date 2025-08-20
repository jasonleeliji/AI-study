import { StudySession } from '../models/studySession.model';
import { StudyStatus } from '../types/studySession';
import { User } from '../models/user.model';
import { Subscription } from '../models/subscription.model';
import { PLAN_DETAILS, TRIAL_DAILY_LIMIT } from '../types';
import { calculateMetrics } from './report.service';
import { sendSessionUpdateToUser } from './realtime.service';
import { Op } from 'sequelize';

export const checkTimeLimitExceeded = async (): Promise<void> => {
    try {
        // 查找所有活跃的会话
        const activeSessions = await StudySession.findAll({
            where: {
                status: { [Op.in]: [StudyStatus.Studying, StudyStatus.Break] }
            }
        });

        for (const session of activeSessions) {
            const userId = session.userId;
            
            // 获取用户订阅信息
            const user = await User.findByPk(userId, { 
                include: [{ 
                    model: Subscription, 
                    as: 'subscription',
                    required: false 
                }] 
            });
            if (!user) continue;

            const sub = user.subscription as any;
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
                // 试用期已结束，强制停止会话
                session.status = StudyStatus.Finished;
                session.endTime = new Date();
                
                // 关闭任何开放的休息
                const openBreak = session.breakHistory?.find(b => !b.endTime);
                if (openBreak) {
                    openBreak.endTime = new Date();
                }
                
                await session.save();
                sendSessionUpdateToUser(userId.toString(), session);
                console.log(`Terminated session ${session.id} - trial expired for user ${userId}`);
                continue;
            }

            // 获取今日所有已完成的会话
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todaySessions = await StudySession.findAll({
                where: {
                    userId: userId,
                    startTime: { [Op.gte]: today, [Op.lt]: tomorrow },
                    status: StudyStatus.Finished
                }
            });

            // 计算今日已使用时间（包括当前会话）
            let todayUsedSeconds = todaySessions.reduce((total, finishedSession) => {
                const metrics = calculateMetrics([finishedSession]);
                return total + metrics.focusedTime;
            }, 0);

            // 添加当前会话的时间
            if (session.status === StudyStatus.Studying || session.status === StudyStatus.Break) {
                const currentMetrics = calculateMetrics([session]);
                todayUsedSeconds += currentMetrics.focusedTime;
            }

            const dailyLimitSeconds = dailyLimitHours * 3600;

            // 如果超过时间限制，停止会话
            if (todayUsedSeconds >= dailyLimitSeconds) {
                session.status = StudyStatus.Finished;
                session.endTime = new Date();
                
                // 关闭任何开放的休息
                const openBreak = session.breakHistory?.find(b => !b.endTime);
                if (openBreak) {
                    openBreak.endTime = new Date();
                }
                
                await session.save();
                sendSessionUpdateToUser(userId.toString(), session);
                console.log(`Terminated session ${session.id} - daily limit exceeded for user ${userId} (${Math.round(todayUsedSeconds/3600*100)/100}/${dailyLimitHours} hours)`);
            }
        }
    } catch (error) {
        console.error('Error checking time limit exceeded:', error);
    }
};