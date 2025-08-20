
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { StudySession } from '../models';
import { calculateMetrics } from '../services/report.service';
import { Op } from 'sequelize';

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const { period } = (req as any).params; // 'daily', 'weekly', 'latest'
  const userId = authReq.user!.id;

  try {
    let startDate = new Date();
    let sessions;

    let metrics;

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        sessions = await StudySession.findAll({ where: { userId, startTime: { [Op.gte]: startDate } } });
        metrics = calculateMetrics(sessions);
        break;
      case 'weekly':
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startDate = new Date(startDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        sessions = await StudySession.findAll({ where: { userId, startTime: { [Op.gte]: startDate } } });
        metrics = calculateMetrics(sessions, 'day');
        break;
      case 'monthly':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        sessions = await StudySession.findAll({ where: { userId, startTime: { [Op.gte]: startDate } } });
        metrics = calculateMetrics(sessions, 'day');
        break;
      case 'latest':
         sessions = await StudySession.findAll({ where: { userId }, order: [['startTime', 'DESC']], limit: 1 });
         metrics = calculateMetrics(sessions);
         break;
      default:
        return (res as any).status(400).json({ message: '无效的报告周期' });
    }

    (res as any).json(metrics);

  } catch (error) {
    next(error);
  }
};

export const deleteAllReports = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;

  try {
    // 删除用户的所有学习会话数据（这些是AI分析的专注时间、学习时间、专注率等数据）
    const result = await StudySession.destroy({ where: { userId } });
    
    console.log(`删除用户 ${userId} 的 ${result} 条学习会话记录`);
    
    (res as any).json({
      success: true,
      message: '修行记录已抹去',
      deletedCount: result
    });

  } catch (error) {
    console.error('删除学习会话记录失败:', error);
    next(error);
  }
};
