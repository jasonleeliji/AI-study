// 时间控制工具函数
import api from '../services/api';
import { SubscriptionPlan } from '../types';

// 缓存UI文案配置
let uiTextCache: { [key: string]: { feedbackTitle: string; sleepMessage: string; idleMessage: string } } = {};

/**
 * 检查当前时间是否在睡觉时间（晚上11点到早上9点）
 * @returns {boolean} 如果在睡觉时间返回true，否则返回false
 */
export const isSleepTime = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  
  // 晚上11点到早上9点之间是睡觉时间
  return hour >= 23 || hour < 9;
};

/**
 * 获取UI文案配置
 * @param plan 订阅计划
 * @returns Promise<{feedbackTitle: string; sleepMessage: string; idleMessage: string}>
 */
export const getUITextConfig = async (plan: SubscriptionPlan): Promise<{ feedbackTitle: string; sleepMessage: string; idleMessage: string }> => {
  // 检查缓存
  if (uiTextCache[plan]) {
    return uiTextCache[plan];
  }
  
  try {
    const config = await api.config.getUITextConfig(plan);
    // 缓存结果
    uiTextCache[plan] = config;
    return config;
  } catch (error) {
    console.error('Failed to get UI text config:', error);
    // 返回默认配置（试用版）
    const defaultConfig = {
      feedbackTitle: '菩萨救我',
      sleepMessage: '夜深了，姐姐也要休息了。小猴子，早睡早起身体好，明日再来修行吧！',
      idleMessage: '小家伙，你再不开始，姐姐就要先睡了....'
    };
    uiTextCache[plan] = defaultConfig;
    return defaultConfig;
  }
};

/**
 * 获取睡觉时间的提示文案
 * @param plan 订阅计划
 * @returns Promise<string> 睡觉时间的提示文案
 */
export const getSleepTimeMessage = async (plan?: SubscriptionPlan | string): Promise<string> => {
    try {
        const planKey = typeof plan === 'string' ? plan : (plan || 'trial');
        const config = await getUITextConfig(planKey as SubscriptionPlan);
        return config.sleepMessage;
    } catch (error) {
        console.error('Failed to get sleep time message:', error);
        return "哎呀，姐姐困了，小屁孩也赶紧去睡觉吧，小心长不高哈！再重要的作业咱也不做了，去吧去吧！";
    }
};

/**
 * 获取反馈区标题
 * @param plan 订阅计划
 * @returns Promise<string> 反馈区标题
 */
export const getFeedbackTitle = async (plan?: SubscriptionPlan | string): Promise<string> => {
    try {
        const planKey = typeof plan === 'string' ? plan : (plan || 'trial');
        const config = await getUITextConfig(planKey as SubscriptionPlan);
        return config.feedbackTitle;
    } catch (error) {
        console.error('Failed to get feedback title:', error);
        return "菩萨有话说";
    }
};

/**
 * 获取空闲状态的提示文案
 * @param plan 订阅计划
 * @returns Promise<string> 空闲状态的提示文案
 */
export const getIdleMessage = async (plan?: SubscriptionPlan | string): Promise<string> => {
    try {
        const planKey = typeof plan === 'string' ? plan : (plan || 'trial');
        const config = await getUITextConfig(planKey as SubscriptionPlan);
        return config.idleMessage;
    } catch (error) {
        console.error('Failed to get idle message:', error);
        return "徒儿，为师已经准备好了，快来开始修行吧！";
    }
};

/**
 * 检查是否应该显示睡觉观音图片
 * @returns {boolean} 如果应该显示睡觉观音返回true，否则返回false
 */
export const shouldShowSleepingGuanyin = (): boolean => {
  return isSleepTime();
};

/**
 * 清除UI文案缓存
 */
export const clearUITextCache = (): void => {
  uiTextCache = {};
};