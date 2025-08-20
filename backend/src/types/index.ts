export * from './subscription';
export * from './studySession';

import { Request } from 'express';

// Extend Express Request type to include user from JWT
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// 获取配置中的价格（这个函数将在需要时动态获取配置）
let cachedConfig: any = null;

export const getPlanDetails = async () => {
  if (!cachedConfig) {
    const { AppConfig } = require('../models');
    cachedConfig = await AppConfig.findOne();
  }
  
  return {
    trial: {
      name: '菩萨救我',
      price: 0,
      dailyTimeLimit: 180 // 3小时
    },
    none: {
      name: '无人救我',
      price: 0,
      dailyTimeLimit: 0 // 无使用时间
    },
    standard: {
      name: '师傅救我',
      price: cachedConfig?.standardPlanPrice || 1990,
      dailyTimeLimit: 180 // 3小时
    },
    pro: {
      name: '菩萨救我',
      price: cachedConfig?.proPlanPrice || 2990,
      dailyTimeLimit: 300 // 5小时
    }
  };
};

// 清除缓存函数
(getPlanDetails as any).clearCache = () => {
  cachedConfig = null;
};

// 为了向后兼容，保留静态的PLAN_DETAILS（使用默认价格）
export const PLAN_DETAILS = {
  trial: {
    name: '菩萨救我',
    price: 0,
    dailyTimeLimit: 180 // 3小时
  },
  none: {
    name: '无人救我',
    price: 0,
    dailyTimeLimit: 0 // 无使用时间
  },
  standard: {
    name: '师傅救我',
    price: parseInt(process.env.VITE_STANDARD_PLAN_PRICE || '1990'),
    dailyTimeLimit: 180 // 3小时
  },
  pro: {
    name: '菩萨救我',
    price: parseInt(process.env.VITE_PRO_PLAN_PRICE || '2990'),
    dailyTimeLimit: 300 // 5小时
  }
};

// 试用版每日时间限制
export const TRIAL_DAILY_LIMIT = 180;

// 默认子档案设置
export const DEFAULT_SETTINGS = {
  nickname: '小朋友',
  age: 8,
  grade: '小学二年级',
  gender: 'boy' as const,
  minSessionDuration: 25, // 最小专注时长（分钟）
  stretchBreak: 5, // 伸展休息时长（分钟）
  waterBreak: 2, // 喝水休息时长（分钟）
  restroomBreak: 3, // 如厕休息时长（分钟）
  forcedBreakDuration: 10, // 强制休息时长（分钟）
  workDurationBeforeForcedBreak: 60, // 强制休息前的工作时长（分钟）
  waterBreakLimit: 3, // 每日喝水次数限制
  restroomBreakLimit: 5, // 每日如厕次数限制
  gamificationStage: 'STONE_MONKEY' as const,
  totalFocusSeconds: 0,
  dailyFocusSeconds: 0,
  lastFocusUpdate: new Date()
};

