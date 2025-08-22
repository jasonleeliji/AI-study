import { Request, Response, NextFunction } from 'express';
import { User, Subscription, ChildProfile } from '../models';
import { SubscriptionPlan } from '../types/character';
import { Op } from 'sequelize';

// 获取所有用户列表
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.phone = { [Op.like]: `%${search}%` };
    }

    // 获取用户列表
    const { count, rows: users } = await User.findAndCountAll({
      where,
      offset: skip,
      limit: limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Subscription, as: 'subscription' },
        { model: ChildProfile, as: 'childProfile' }
      ]
    });

    // 获取每个用户的订阅信息和档案信息
    const usersWithDetails = users.map(user => {
      const subscription = user.subscription;
      const profile = user.childProfile;
      
      const now = new Date();
      const hasActiveSubscription = subscription && subscription.endDate > now;
      const isTrialActive = user.trialEndDate && user.trialEndDate > now;
      
      let currentPlan = 'STANDARD';
      let planEndDate = null;
      
      if (hasActiveSubscription) {
        currentPlan = subscription.plan.toUpperCase();
        planEndDate = subscription.endDate;
      } else if (isTrialActive) {
        currentPlan = 'TRIAL';
        planEndDate = user.trialEndDate;
      }
      
      return {
        id: user.id,
        phone: user.phone,
        createdAt: user.createdAt,
        gamificationStage: profile?.gamificationStage || 'STONE_MONKEY',
        currentPlan,
        planEndDate,
        childName: profile?.nickname || '未设置',
        childAge: profile?.age || 0
      };
    });

    res.json({
      users: usersWithDetails,
      pagination: {
        current: page,
        total: Math.ceil(count / limit),
        hasNext: page * limit < count,
        totalUsers: count
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 根据手机号搜索用户
export const searchUserByPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.params;
    
    const user = await User.findOne({ 
      where: { phone }, 
      include: [
        { model: Subscription, as: 'subscription' },
        { model: ChildProfile, as: 'childProfile' }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    const subscription = user.subscription;
    const profile = user.childProfile;
    
    const now = new Date();
    const hasActiveSubscription = subscription && subscription.endDate > now;
    const isTrialActive = user.trialEndDate && user.trialEndDate > now;
    
    let currentPlan = 'STANDARD';
    let planEndDate = null;
    
    if (hasActiveSubscription) {
      currentPlan = subscription.plan.toUpperCase();
      planEndDate = subscription.endDate;
    } else if (isTrialActive) {
      currentPlan = 'TRIAL';
      planEndDate = user.trialEndDate;
    }
    
    const userDetails = {
      id: user.id,
      phone: user.phone,
      createdAt: user.createdAt,
      gamificationStage: profile?.gamificationStage || 'STONE_MONKEY',
      currentPlan,
      planEndDate,
      childName: profile?.nickname || '未设置',
      childAge: profile?.age || 0,
      trialEndDate: user.trialEndDate
    };

    res.json(userDetails);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 更新用户订阅服务
export const updateUserSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { plan, days } = req.body;

    // 验证参数
    if (!plan || !days || days <= 0) {
      return res.status(400).json({ message: '订阅计划和天数不能为空，且天数必须大于0' });
    }

    const validPlans = ['TRIAL', 'STANDARD', 'PRO'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: '无效的订阅计划' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    if (plan === 'TRIAL') {
      // 更新试用期
      await user.update({ trialEndDate: endDate });
    } else {
      // 更新或创建订阅
      let subscription = await Subscription.findOne({ where: { userId: userId } });
      
      if (subscription) {
        // 更新现有订阅
        await subscription.update({
          plan: plan.toLowerCase() as SubscriptionPlan,
          startDate: now,
          endDate,
          status: 'active'
        });
      } else {
        // 创建新订阅
        await Subscription.create({
          userId: userId,
          plan: plan.toLowerCase() as SubscriptionPlan,
          startDate: now,
          endDate,
          status: 'active'
        });
      }
    }

    res.json({ 
      message: '用户订阅更新成功',
      plan,
      endDate,
      days
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 获取用户详细信息
export const getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, { 
      include: [
        { model: Subscription, as: 'subscription' },
        { model: ChildProfile, as: 'childProfile' }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: '用户未找到' });
    }

    const subscription = user.subscription;
    const profile = user.childProfile;
    
    const now = new Date();
    const hasActiveSubscription = subscription && subscription.endDate > now;
    const isTrialActive = user.trialEndDate && user.trialEndDate > now;
    
    let currentPlan = 'STANDARD';
    let planEndDate = null;
    
    if (hasActiveSubscription) {
      currentPlan = subscription.plan.toUpperCase();
      planEndDate = subscription.endDate;
    } else if (isTrialActive) {
      currentPlan = 'TRIAL';
      planEndDate = user.trialEndDate;
    }
    
    const userDetails = {
      id: user.id,
      phone: user.phone,
      createdAt: user.createdAt,
      gamificationStage: profile?.gamificationStage || 'STONE_MONKEY',
      currentPlan,
      planEndDate,
      childName: profile?.nickname || '未设置',
      childAge: profile?.age || 0,
      trialEndDate: user.trialEndDate
    };

    res.json(userDetails);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};