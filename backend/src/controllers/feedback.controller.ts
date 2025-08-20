import { Request, Response, NextFunction } from 'express';
import { Feedback } from '../models';
import { AuthenticatedRequest } from '../types';

export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const { content } = req.body;

  // 验证反馈内容
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ message: '反馈内容不能为空' });
  }

  // 限制反馈内容长度
  if (content.length > 200) {
    return res.status(400).json({ message: '反馈内容不能超过200字' });
  }

  try {
    // 创建反馈记录
    const feedback = await Feedback.create({
      userId: authReq.user!.id,
      content: content.trim(),
    });

    res.status(201).json({
      message: '反馈提交成功，感谢您的宝贵意见！',
      feedback: {
        id: feedback.id,
        content: feedback.content,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};