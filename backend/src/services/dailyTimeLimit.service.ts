import { User } from '../models/user.model';
import { StudySession } from '../models/studySession.model';
import { Subscription } from '../models/subscription.model';
import { Op } from 'sequelize';

export class DailyTimeLimitService {
  /**
   * 获取用户的每日时间限制（秒）
   */
  static async getDailyLimitSeconds(userId: string): Promise<number> {
    const user = await User.findByPk(userId, { include: [{ model: Subscription, as: 'subscription' }] });
    if (!user) throw new Error('用户不存在');

    // 检查是否有有效订阅
    if (user.subscription) {
      const subscription = user.subscription as any;
      if (subscription.endDate > new Date()) {
        // 有效订阅，根据计划类型返回限制
        switch (subscription.planType) {
          case 'standard': return 3 * 60 * 60; // 3小时
          case 'pro': return 5 * 60 * 60; // 5小时
          default: return 1 * 60 * 60; // 1小时（默认）
        }
      }
    }

    // 检查试用期
    if (user.trialEndDate && user.trialEndDate > new Date()) {
      return 1 * 60 * 60; // 试用期1小时
    }

    return 1 * 60 * 60; // 默认1小时
  }

  /**
   * 检查是否需要重置每日时间限制
   */
  static isNewDay(lastResetDate: Date): boolean {
    const today = new Date();
    const lastReset = new Date(lastResetDate);
    
    return today.getDate() !== lastReset.getDate() ||
           today.getMonth() !== lastReset.getMonth() ||
           today.getFullYear() !== lastReset.getFullYear();
  }

  /**
   * 获取今日已使用的时间（秒）
   */
  static async getTodayUsedSeconds(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await StudySession.findAll({
      where: {
        userId,
        startTime: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: 'finished'
      }
    });

    let totalUsedSeconds = 0;
    for (const session of sessions) {
      if (session.endTime) {
        const sessionDuration = Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000);
        // 减去休息时间
        const breakDuration = (session.breakHistory || []).reduce((acc: number, br: any) => {
          if (br.endTime) {
            return acc + Math.floor((new Date(br.endTime).getTime() - new Date(br.startTime).getTime()) / 1000);
          }
          return acc;
        }, 0);
        totalUsedSeconds += Math.max(0, sessionDuration - breakDuration);
      }
    }

    return totalUsedSeconds;
  }

  /**
   * 更新用户的每日剩余时间
   */
  static async updateDailyRemainingSeconds(userId: string): Promise<{ remainingSeconds: number; dailyLimitSeconds: number }> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('用户不存在');

    const dailyLimitSeconds = await this.getDailyLimitSeconds(userId);
    const todayUsedSeconds = await this.getTodayUsedSeconds(userId);

    // 检查是否需要重置（新的一天）
    if (this.isNewDay(user.lastResetDate || new Date())) {
      // 新的一天，重置剩余时间
      user.dailyRemainingSeconds = dailyLimitSeconds;
      user.lastResetDate = new Date();
    } else {
      // 同一天，计算剩余时间
      user.dailyRemainingSeconds = Math.max(0, dailyLimitSeconds - todayUsedSeconds);
    }

    await user.save();

    return {
      remainingSeconds: user.dailyRemainingSeconds,
      dailyLimitSeconds
    };
  }

  /**
   * 减少剩余时间（在修行过程中调用）
   */
  static async decreaseRemainingSeconds(userId: string, seconds: number): Promise<number> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('用户不存在');

    user.dailyRemainingSeconds = Math.max(0, (user.dailyRemainingSeconds || 0) - seconds);
    await user.save();

    return user.dailyRemainingSeconds;
  }

  /**
   * 获取用户当前的剩余时间
   */
  static async getRemainingSeconds(userId: string): Promise<{ remainingSeconds: number; dailyLimitSeconds: number }> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('用户不存在');

    // 如果是新的一天或者剩余时间为0，重新计算
    if (this.isNewDay(user.lastResetDate || new Date()) || (user.dailyRemainingSeconds || 0) === 0) {
      return await this.updateDailyRemainingSeconds(userId);
    }

    const dailyLimitSeconds = await this.getDailyLimitSeconds(userId);
    return {
      remainingSeconds: user.dailyRemainingSeconds || 0,
      dailyLimitSeconds
    };
  }
}