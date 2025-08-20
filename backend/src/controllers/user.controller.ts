
import { Request, Response, NextFunction } from 'express';
import { ChildProfile } from '../models';
import { AuthenticatedRequest } from '../types';

export const getChildProfile = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    let profile = await ChildProfile.findOne({ where: { userId: authReq.user!.id } });
    if (!profile) {
      profile = await ChildProfile.create({
        userId: authReq.user!.id,
        nickname: '默认昵称',
        age: 6,
        grade: '一年级',
        gender: 'boy',
        minSessionDuration: 25,
        stretchBreak: 5,
        waterBreak: 2,
        restroomBreak: 3,
        forcedBreakDuration: 10,
        workDurationBeforeForcedBreak: 45,
        waterBreakLimit: 3,
        restroomBreakLimit: 2,
      });
    }
    (res as any).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateChildProfile = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const [affectedRows] = await ChildProfile.update((req as any).body, {
      where: { userId: authReq.user!.id },
    });

    if (affectedRows > 0) {
        const updatedProfile = await ChildProfile.findOne({ where: { userId: authReq.user!.id } });
        (res as any).json(updatedProfile);
    } else {
        return (res as any).status(404).json({ message: '用户档案未找到' });
    }
  } catch (error) {
    next(error);
  }
};
