import { Request, Response, NextFunction } from 'express';
import { TokenUsage, StudySession } from '../models';
import { StudyState } from '../types/character';
import { StudyStatus } from '../types/studySession';
import { AuthenticatedRequest } from '../types';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

// 获取token使用统计
export const getTokenStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    console.log('=== Token Stats Request ===');
    console.log('User ID:', userId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    console.log('Today range:', { todayStart, todayEnd });

    // 1. 获取当前会话的token消耗
    let currentSessionStats = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      analysisCount: 0
    };
    const activeSession = await StudySession.findOne({
      where: {
        userId,
        status: {
          [Op.in]: [StudyStatus.Studying, StudyStatus.Break]
        }
      },
      order: [['createdAt', 'DESC']]
    });

    if (activeSession) {
      console.log('Found active session:', activeSession.id, 'Status:', activeSession.status);
      const sessionTokenUsage = await TokenUsage.findOne({
        where: {
          userId,
          sessionId: activeSession.id
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalTokens')), 'totalTokens'],
          [sequelize.fn('SUM', sequelize.col('inputTokens')), 'inputTokens'],
          [sequelize.fn('SUM', sequelize.col('outputTokens')), 'outputTokens'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'analysisCount']
        ],
        raw: true
      });
      console.log('Session token usage query result:', sessionTokenUsage);
      if (sessionTokenUsage) {
        currentSessionStats = {
          totalTokens: Number(sessionTokenUsage.totalTokens) || 0,
          inputTokens: Number(sessionTokenUsage.inputTokens) || 0,
          outputTokens: Number(sessionTokenUsage.outputTokens) || 0,
          analysisCount: Number(sessionTokenUsage.analysisCount) || 0
        };
      }
    } else {
      console.log('No active session found for user:', userId);
    }

    // 2. 获取今日总消耗
    console.log('Querying today token usage...');
    const todayTokenUsage = await TokenUsage.findOne({
      where: {
        userId,
        createdAt: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalTokens')), 'totalTokens'],
        [sequelize.fn('SUM', sequelize.col('inputTokens')), 'inputTokens'],
        [sequelize.fn('SUM', sequelize.col('outputTokens')), 'outputTokens'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'analysisCount']
      ],
      raw: true
    });
    console.log('Today token usage result:', todayTokenUsage);

    const todayStats = {
      totalTokens: Number(todayTokenUsage?.totalTokens) || 0,
      inputTokens: Number(todayTokenUsage?.inputTokens) || 0,
      outputTokens: Number(todayTokenUsage?.outputTokens) || 0,
      analysisCount: Number(todayTokenUsage?.analysisCount) || 0
    };

    // 3. 获取账号累计消耗
    console.log('Querying total token usage...');
    const totalTokenUsage = await TokenUsage.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalTokens')), 'totalTokens'],
        [sequelize.fn('SUM', sequelize.col('inputTokens')), 'inputTokens'],
        [sequelize.fn('SUM', sequelize.col('outputTokens')), 'outputTokens'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'analysisCount']
      ],
      raw: true
    });
    console.log('Total token usage result:', totalTokenUsage);

    const totalStats = {
      totalTokens: Number(totalTokenUsage?.totalTokens) || 0,
      inputTokens: Number(totalTokenUsage?.inputTokens) || 0,
      outputTokens: Number(totalTokenUsage?.outputTokens) || 0,
      analysisCount: Number(totalTokenUsage?.analysisCount) || 0
    };

    // 检查数据库中是否有任何token记录
    const tokenCount = await TokenUsage.count({ where: { userId } });
    console.log('Total token records for user:', tokenCount);

    // 4. 获取最近一次分析的token消耗
    const lastAnalysis = await TokenUsage.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    console.log('Last analysis:', lastAnalysis);

    const lastAnalysisTokens = lastAnalysis ? {
      inputTokens: lastAnalysis.inputTokens,
      outputTokens: lastAnalysis.outputTokens,
      totalTokens: lastAnalysis.totalTokens,
      createdAt: lastAnalysis.createdAt
    } : null;

    const responseData = {
      lastAnalysis: lastAnalysisTokens,
      currentSession: {
        totalTokens: currentSessionStats.totalTokens,
        inputTokens: currentSessionStats.inputTokens,
        outputTokens: currentSessionStats.outputTokens,
        analysisCount: currentSessionStats.analysisCount,
        sessionId: activeSession?.id || null
      },
      today: {
        totalTokens: todayStats.totalTokens,
        inputTokens: todayStats.inputTokens,
        outputTokens: todayStats.outputTokens,
        analysisCount: todayStats.analysisCount
      },
      total: {
        totalTokens: totalStats.totalTokens,
        inputTokens: totalStats.inputTokens,
        outputTokens: totalStats.outputTokens,
        analysisCount: totalStats.analysisCount
      }
    };

    console.log('Final response data:', JSON.stringify(responseData, null, 2));

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({ message: '内部服务器错误' });
  }
};

// 获取token使用历史
export const getTokenHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const tokenHistory = await TokenUsage.findAll({
      where: { userId },
      include: [{
        model: StudySession,
        as: 'session',
        attributes: ['createdAt', 'status']
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: Number(limit)
    });

    const total = await TokenUsage.count({ where: { userId } });

    res.json({
      success: true,
      data: {
        history: tokenHistory,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          hasNext: offset + tokenHistory.length < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching token history:', error);
    res.status(500).json({ message: '内部服务器错误' });
  }
};