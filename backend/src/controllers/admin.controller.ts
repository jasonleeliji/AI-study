import { Request, Response, NextFunction } from 'express';
import { User, TokenUsage, Feedback, StudySession } from '../models';
import { StudyState } from '../types/character';
import { StudyStatus } from '../types/studySession';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

// 获取数据看板统计
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 1. 今日活跃用户数（有学习会话的用户）
    const todayActiveUsers = await StudySession.count({
      distinct: true,
      col: 'userId',
      where: {
        startTime: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    });

    // 2. 总用户数
    const totalUsers = await User.count();

    // 3. 今日新注册用户数
    const todayNewUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    });

    // 4. 今日总token消耗
    const todayTokenStats = await TokenUsage.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalTokens')), 'totalTokens'],
        [sequelize.fn('SUM', sequelize.col('inputTokens')), 'inputTokens'],
        [sequelize.fn('SUM', sequelize.col('outputTokens')), 'outputTokens'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'analysisCount']
      ],
      where: {
        createdAt: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      },
      raw: true
    });

    // 5. 今日学习会话数
    const todaySessionCount = await StudySession.count({
      where: {
        startTime: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    });

    // 6. 当前在线用户数（正在学习的用户）
    const onlineUsers = await StudySession.count({
      where: {
        status: StudyStatus.Studying
      }
    });

    const tokenStats = {
      totalTokens: Number(todayTokenStats?.totalTokens) || 0,
      inputTokens: Number(todayTokenStats?.inputTokens) || 0,
      outputTokens: Number(todayTokenStats?.outputTokens) || 0,
      analysisCount: Number(todayTokenStats?.analysisCount) || 0
    };

    res.json({
      success: true,
      data: {
        todayActiveUsers,
        totalUsers,
        todayNewUsers,
        todaySessionCount,
        onlineUsers,
        todayTokenStats: tokenStats
      }
    });
  } catch (error) {
    console.error('获取数据看板统计失败:', error);
    res.status(500).json({ message: '获取数据看板统计失败' });
  }
};

// 获取所有用户的token使用统计
export const getAllUsersTokenStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, sortBy = 'totalTokens', sortOrder = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const users = await User.findAll({
      attributes: {
        include: [
          [sequelize.fn('SUM', sequelize.col('tokenUsages.totalTokens')), 'totalTokens'],
          [sequelize.fn('SUM', sequelize.col('tokenUsages.inputTokens')), 'totalInputTokens'],
          [sequelize.fn('SUM', sequelize.col('tokenUsages.outputTokens')), 'totalOutputTokens'],
          [sequelize.fn('COUNT', sequelize.col('tokenUsages.id')), 'totalAnalysisCount'],
          [sequelize.literal(`SUM(CASE WHEN \`tokenUsages\`.\`createdAt\` >= '${todayStart.toISOString()}' THEN \`tokenUsages\`.\`totalTokens\` ELSE 0 END)`), 'todayTokens'],
        ]
      },
      include: [{
        model: TokenUsage,
        as: 'tokenUsages',
        attributes: []
      }],
      group: ['User.id'],
      order: [[sortBy as string, sortOrder as string]],
      offset,
      limit: Number(limit),
      subQuery: false
    });

    const totalCount = await User.count();

    const totalStats = await TokenUsage.findOne({
        attributes: [
            [sequelize.fn('SUM', sequelize.col('totalTokens')), 'totalTokens'],
            [sequelize.fn('SUM', sequelize.col('inputTokens')), 'inputTokens'],
            [sequelize.fn('SUM', sequelize.col('outputTokens')), 'outputTokens'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'analysisCount']
        ],
        raw: true
    });

    const overallStats = {
        totalTokens: Number(totalStats?.totalTokens) || 0,
        inputTokens: Number(totalStats?.inputTokens) || 0,
        outputTokens: Number(totalStats?.outputTokens) || 0,
        analysisCount: Number(totalStats?.analysisCount) || 0
    };

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: Number(page),
          total: Math.ceil(totalCount / Number(limit)),
          hasNext: offset + users.length < totalCount,
          totalCount
        },
        overallStats
      }
    });

  } catch (error) {
    console.error('获取用户token统计失败:', error);
    res.status(500).json({ message: '获取用户token统计失败' });
  }
};

// 获取反馈列表
export const getFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, rating, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (rating) where.rating = Number(rating);
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    const feedbacks = await Feedback.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'phone'] },
        { model: StudySession, as: 'session', attributes: ['id', 'startTime'] }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: Number(limit)
    });

    const totalCount = await Feedback.count({ where });

    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          current: Number(page),
          total: Math.ceil(totalCount / Number(limit)),
          hasNext: offset + feedbacks.length < totalCount,
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ message: '获取反馈列表失败' });
  }
};

// 更新反馈状态
export const updateFeedbackStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ message: '未找到反馈' });
    }

    feedback.status = status;
    await feedback.save();

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('更新反馈状态失败:', error);
    res.status(500).json({ message: '更新反馈状态失败' });
  }
};