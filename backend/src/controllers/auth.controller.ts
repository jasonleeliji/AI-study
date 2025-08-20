
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, ChildProfile, Subscription } from '../models';
import config from '../config';
import { AuthenticatedRequest, DEFAULT_SETTINGS, PLAN_DETAILS, TRIAL_DAILY_LIMIT } from '../types';
import { SubscriptionPlan } from '../types/character';
import { DailyTimeLimitService } from '../services/dailyTimeLimit.service';

const generateToken = (id: string) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { phone, password } = (req as any).body;

  if (!phone || !password || !/^\d{11}$/.test(phone)) {
    return (res as any).status(400).json({ message: '请提供有效的11位手机号码和密码' });
  }

  try {
    const userExists = await User.findOne({ where: { phone } });
    if (userExists) {
      return (res as any).status(400).json({ message: '用户已存在' });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

    const user = await User.create({ phone, password, trialEndDate });

    // Create a default subscription entry
    const defaultSubscription = await Subscription.create({
        userId: user.id,
        plan: 'none',
        status: 'inactive',
        startDate: new Date(),
        endDate: trialEndDate,
    });
    
    // Create a default child profile
    await ChildProfile.create({
        userId: user.id,
        ...DEFAULT_SETTINGS,
    });
    
    (res as any).status(201).json({
      _id: user.id,
      phone: user.phone,
      token: generateToken(user.id!.toString()),
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { phone, password } = (req as any).body;
  try {
    const user = await User.findOne({ where: { phone } });

    if (user && (await user.matchPassword(password))) {
      (res as any).json({
        _id: user.id,
        phone: user.phone,
        token: generateToken(user.id!.toString()),
      });
    } else {
      (res as any).status(401).json({ message: '手机号码或密码无效' });
    }
  } catch (error) {
    next(error);
  }
};

export const getUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    try {
        const user = await User.findByPk(authReq.user!.id, {
            include: [{ 
                model: Subscription, 
                as: 'subscription',
                required: false 
            }]
        });
        if (!user) {
            return (res as any).status(404).json({ message: '用户未找到' });
        }

        const sub = user.subscription as any;
        const now = new Date();
        const hasActiveSubscription = sub && sub.status === 'active' && sub.endDate && sub.endDate > now;
        const isTrialActive = user.trialEndDate && user.trialEndDate > now;

        let planName = '无人救我';
        let effectiveDailyLimit = 0; // in hours

        if (hasActiveSubscription) {
            const planDetails = PLAN_DETAILS[sub.plan as Exclude<SubscriptionPlan, 'none'>];
            planName = planDetails.name;
            effectiveDailyLimit = planDetails.dailyTimeLimit;
        } else if (isTrialActive) {
            planName = '菩萨救我';
            effectiveDailyLimit = TRIAL_DAILY_LIMIT;
        }

        // 使用新的时间限制服务获取剩余时间
        let remainingSeconds = 0;
        let dailyLimitSeconds = 0;
        
        if (effectiveDailyLimit > 0) {
            const timeData = await DailyTimeLimitService.getRemainingSeconds(authReq.user!.id);
            remainingSeconds = timeData.remainingSeconds;
            dailyLimitSeconds = timeData.dailyLimitSeconds;
        }

        // 计算剩余天数
        let remainingDays = 0;
        if (hasActiveSubscription && sub.endDate) {
            const timeDiff = sub.endDate.getTime() - now.getTime();
            remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        } else if (isTrialActive && user.trialEndDate) {
            const timeDiff = user.trialEndDate.getTime() - now.getTime();
            remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        }
        
        (res as any).json({
            isAuthenticated: true,
            user: { phone: user.phone },
            isTrialActive,
            hasActiveSubscription,
            planName,
            effectiveDailyLimit,
            remainingSeconds,
            remainingDays,
            subscriptionEndDate: hasActiveSubscription ? sub.endDate : null,
            trialEndDate: user.trialEndDate,
            totalTokensUsed: user.totalTokensUsed || 0,
            isParentVerified: user.isParentVerified || false, // 添加家长验证状态
        });

    } catch (error) {
        next(error);
    }
};

// 发送验证码（模拟实现）
export const sendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    const { phone } = (req as any).body;
    
    if (!phone || !/^\d{11}$/.test(phone)) {
        return (res as any).status(400).json({ message: '请提供有效的11位手机号' });
    }
    
    try {
        // 在实际应用中，这里应该调用短信服务API发送验证码
        // 现在我们只是模拟发送成功
        console.log(`模拟发送验证码到手机号: ${phone}`);
        
        (res as any).json({ 
            message: '验证码发送成功',
            // 在测试环境中，可以返回验证码用于调试
            code: process.env.NODE_ENV === 'development' ? '123456' : undefined
        });
    } catch (error) {
        next(error);
    }
};

// 验证验证码
export const verifyCode = async (req: Request, res: Response, next: NextFunction) => {
    const { phone, code } = (req as any).body;
    
    if (!phone || !code) {
        return (res as any).status(400).json({ message: '请提供手机号和验证码' });
    }
    
    try {
        // 在实际应用中，这里应该验证验证码的有效性
        // 现在我们模拟验证成功（任何6位数字都通过）
        if (!/^\d{6}$/.test(code)) {
            return (res as any).status(400).json({ message: '验证码格式错误' });
        }
        
        // 查找用户
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return (res as any).status(404).json({ message: '用户不存在' });
        }
        
        // 更新用户的家长验证状态
        user.isParentVerified = true;
        await user.save();
        
        console.log(`用户 ${user.phone} 家长验证成功`);
        
        (res as any).json({ 
            message: '验证成功',
            isParentVerified: true
        });
    } catch (error) {
        next(error);
    }
};

// 修改密码
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const { currentPassword, newPassword } = (req as any).body;
    
    if (!currentPassword || !newPassword) {
        return (res as any).status(400).json({ message: '请提供当前密码和新密码' });
    }
    
    if (newPassword.length < 6) {
        return (res as any).status(400).json({ message: '新密码长度至少6位' });
    }
    
    try {
        const user = await User.findByPk(authReq.user!.id);
        if (!user) {
            return (res as any).status(404).json({ message: '用户不存在' });
        }
        
        // 验证当前密码
        const isCurrentPasswordValid = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return (res as any).status(401).json({ message: '当前密码错误' });
        }
        
        // 更新密码
        user.password = newPassword;
        await user.save();
        
        console.log(`用户 ${user.phone} 密码修改成功`);
        
        (res as any).json({ 
            message: '密码修改成功'
        });
    } catch (error) {
        next(error);
    }
};

// 忘记密码 - 发送验证码
export const forgotPasswordSendCode = async (req: Request, res: Response, next: NextFunction) => {
    const { phone } = (req as any).body;
    
    if (!phone || !/^\d{11}$/.test(phone)) {
        return (res as any).status(400).json({ message: '请提供有效的11位手机号' });
    }
    
    try {
        // 检查用户是否存在
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return (res as any).status(404).json({ message: '该手机号未注册' });
        }
        
        // 在实际应用中，这里应该调用短信服务API发送验证码
        // 现在我们只是模拟发送成功
        console.log(`模拟发送忘记密码验证码到手机号: ${phone}`);
        
        (res as any).json({ 
            message: '验证码发送成功',
            // 在测试环境中，可以返回验证码用于调试
            code: process.env.NODE_ENV === 'development' ? '123456' : undefined
        });
    } catch (error) {
        next(error);
    }
};

// 忘记密码 - 验证验证码
export const forgotPasswordVerifyCode = async (req: Request, res: Response, next: NextFunction) => {
    const { phone, code } = (req as any).body;
    
    if (!phone || !code) {
        return (res as any).status(400).json({ message: '请提供手机号和验证码' });
    }
    
    try {
        // 检查用户是否存在
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return (res as any).status(404).json({ message: '该手机号未注册' });
        }
        
        // 在实际应用中，这里应该验证验证码的有效性
        // 现在我们模拟验证成功（任何6位数字都通过）
        if (!/^\d{6}$/.test(code)) {
            return (res as any).status(400).json({ message: '验证码格式错误' });
        }
        
        console.log(`用户 ${user.phone} 忘记密码验证码验证成功`);
        
        (res as any).json({ 
            message: '验证码验证成功'
        });
    } catch (error) {
        next(error);
    }
};

// 忘记密码 - 重置密码
export const forgotPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    const { phone, code, newPassword } = (req as any).body;
    
    if (!phone || !code || !newPassword) {
        return (res as any).status(400).json({ message: '请提供手机号、验证码和新密码' });
    }
    
    if (newPassword.length < 6) {
        return (res as any).status(400).json({ message: '新密码长度至少6位' });
    }
    
    try {
        // 检查用户是否存在
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return (res as any).status(404).json({ message: '该手机号未注册' });
        }
        
        // 在实际应用中，这里应该再次验证验证码的有效性
        // 现在我们模拟验证成功（任何6位数字都通过）
        if (!/^\d{6}$/.test(code)) {
            return (res as any).status(400).json({ message: '验证码格式错误' });
        }
        
        // 更新密码
        user.password = newPassword;
        await user.save();
        
        console.log(`用户 ${user.phone} 通过忘记密码功能重置密码成功`);
        
        (res as any).json({ 
            message: '密码重置成功'
        });
    } catch (error) {
        next(error);
    }
};
