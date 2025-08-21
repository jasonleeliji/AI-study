import { Request, Response, NextFunction } from 'express';
import configManagerService from '../services/configManager.service';
import { SubscriptionPlan, CharacterRank, StudyState, FocusState, DistractedSubtype } from '../types/character';
import { AppConfig, AiPromptConfig, User, Subscription } from '../models';
import { AuthenticatedRequest, getPlanDetails } from '../types';
import { broadcastConfigUpdate } from '../services/realtime.service';

// Helper to get or create the singleton AppConfig
const getSingletonAppConfig = async () => {
    let config = await AppConfig.findOne();
    if (!config) {
        config = await AppConfig.create({
            positiveFeedbackMinutes: 30,
            standardPlanPrice: 1990,
            proPlanPrice: 2990,
            stoneMonkeyGoalTokens: 100,
            caveMasterGoalTokens: 500,
            monkeyKingGoalTokens: 1000,
            totalMonkeyKingGoalTokens: 5000,
            wechatQrImageUrl: 'https://example.com/wechat-qr.png'
        });
    }
    return config;
};

// Controller to get the current application configuration
export const getAppConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const configInstance = await getSingletonAppConfig();
        const config = configInstance.get({ plain: true });
        const authReq = req as AuthenticatedRequest;

        // 获取所有订阅计划的分析间隔配置
        const aiPromptConfigs = await AiPromptConfig.findAll();

        // 将分析间隔信息添加到配置中
        if (aiPromptConfigs && aiPromptConfigs.length > 0) {
            (config as any).planIntervals = {};
            aiPromptConfigs.forEach(promptConfig => {
                if (promptConfig.subscriptionPlan && promptConfig.analysisIntervalSeconds) {
                    (config as any).planIntervals[promptConfig.subscriptionPlan] = promptConfig.analysisIntervalSeconds;
                }
            });
            console.log('getAppConfig - 设置planIntervals:', JSON.stringify((config as any).planIntervals));
        }

        // 如果用户已登录，获取其订阅计划对应的分析间隔
        if (authReq.user && authReq.user.id) {
            try {
                const user = await User.findByPk(authReq.user.id);
                const subscription = await Subscription.findOne({ where: { userId: authReq.user.id } });

                let subscriptionPlan: SubscriptionPlan;
                const hasActiveSubscription = subscription && subscription.endDate > new Date();
                const isTrialActive = user?.trialEndDate && user.trialEndDate > new Date();

                if (hasActiveSubscription && subscription.plan === 'pro') {
                    subscriptionPlan = SubscriptionPlan.PRO;
                } else if (isTrialActive) {
                    subscriptionPlan = SubscriptionPlan.TRIAL;
                } else {
                    subscriptionPlan = SubscriptionPlan.STANDARD;
                }

                // 获取对应计划的AI提示词配置
                const aiPromptConfig = await AiPromptConfig.findOne({ where: { subscriptionPlan } });

                if (aiPromptConfig && aiPromptConfig.analysisIntervalSeconds) {
                    // 将分析间隔添加到配置中
                    (config as any).analysisIntervalSeconds = aiPromptConfig.analysisIntervalSeconds;
                    console.log(`为用户 ${authReq.user.id} (${subscriptionPlan}) 设置分析间隔: ${aiPromptConfig.analysisIntervalSeconds}秒`);
                }
            } catch (err) {
                console.error('获取用户订阅计划分析间隔失败:', err);
                // 出错时不阻止返回基本配置
            }
        }

        res.json(config);
    } catch (error) {
        next(error);
    }
};

// Controller to update the application configuration (admin only)
export const updateAppConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await getSingletonAppConfig();

        // Update the configuration with the provided data
        await config.update(req.body);

        // Clear the plan details cache
        (getPlanDetails as any).clearCache();

        // Broadcast the configuration update to all connected clients
        broadcastConfigUpdate(config.get({ plain: true }));

        res.json(config);
    } catch (error) {
        next(error);
    }
};

// Controller to get plan details with current pricing
export const getPlanDetailsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planDetails = await getPlanDetails();
        res.json(planDetails);
    } catch (error) {
        next(error);
    }
};

// Controller to get UI text configuration based on subscription plan
export const getUITextConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { plan } = req.query;

        let feedbackTitle = '';
        let sleepMessage = '';
        let idleMessage = '';

        // 根据订阅计划返回对应的UI文本配置
        switch (plan as string) {
            case 'trial':
                feedbackTitle = '菩萨救我';
                sleepMessage = '夜深了，姐姐也要休息了。小猴子，早睡早起身体好，明日再来修行吧！';
                idleMessage = '小家伙，你再不开始，姐姐就要先睡了....';
                break;
            case 'standard':
                feedbackTitle = '师傅救我';
                sleepMessage = '徒儿，夜深了，为师也要休息了。早睡早起身体好，明日再来修行吧！';
                idleMessage = '徒儿，为师已经准备好了，快来开始修行吧！';
                break;
            case 'pro':
                feedbackTitle = '菩萨救我';
                sleepMessage = '夜深了，姐姐也要休息了。小猴子，早睡早起身体好，明日再来修行吧！';
                idleMessage = '小家伙，你再不开始，姐姐就要先睡了....';
                break;
            default:
                // 默认使用试用版配置
                feedbackTitle = '菩萨救我';
                sleepMessage = '夜深了，姐姐也要休息了。小猴子，早睡早起身体好，明日再来修行吧！';
                idleMessage = '小家伙，你再不开始，姐姐就要先睡了....';
                break;
        }

        res.json({
            feedbackTitle,
            sleepMessage,
            idleMessage
        });
    } catch (error) {
        next(error);
    }
};

// ==================== AI提示词配置管理 ====================

export const getAiPromptConfigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await configManagerService.getAllAiPromptConfigs();
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAiPromptConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionPlan } = req.params;
    const config = await configManagerService.getAiPromptConfig(subscriptionPlan as SubscriptionPlan);
    if (!config) {
      return res.status(404).json({ message: 'AI提示词配置未找到' });
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertAiPromptConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await configManagerService.upsertAiPromptConfig(req.body);

    // 更新AI提示词配置后，广播配置更新
    try {
      // 获取应用配置
      const appConfig = await AppConfig.findOne();
      if (!appConfig) {
        throw new Error("AppConfig not found");
      }

      // 获取所有订阅计划的分析间隔配置
      const aiPromptConfigs = await AiPromptConfig.findAll();

      // 将分析间隔信息添加到配置中
      const configWithIntervals = appConfig.toJSON();

      // 添加各订阅计划的分析间隔信息
      if (aiPromptConfigs && aiPromptConfigs.length > 0) {
        (configWithIntervals as any).planIntervals = {};
        aiPromptConfigs.forEach(config => {
          if (config.subscriptionPlan && config.analysisIntervalSeconds) {
            (configWithIntervals as any).planIntervals[config.subscriptionPlan] = config.analysisIntervalSeconds;
          }
        });

        // 设置默认分析间隔（使用标准版的值）
        const standardConfig = aiPromptConfigs.find(c => c.subscriptionPlan === SubscriptionPlan.STANDARD);
        if (standardConfig && standardConfig.analysisIntervalSeconds) {
          (configWithIntervals as any).analysisIntervalSeconds = standardConfig.analysisIntervalSeconds;
        }

        console.log('AI提示词配置更新后广播配置更新，包含分析间隔信息:', JSON.stringify((configWithIntervals as any).planIntervals));
      }

      // 导入并调用广播函数
      const { broadcastConfigUpdate } = await import('../services/realtime.service');
      broadcastConfigUpdate(configWithIntervals);
    } catch (broadcastError) {
      console.error('广播配置更新失败:', broadcastError);
      // 不阻止正常响应
    }

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAiPromptConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await configManagerService.deleteAiPromptConfig(parseInt(id));
    res.json({ message: 'AI提示词配置已删除' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== 反馈消息配置管理 ====================

export const getFeedbackMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await configManagerService.getAllFeedbackMessages();
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { characterRank, subscriptionPlan, focusState, distractedSubtype } = req.query;
    const message = await configManagerService.getFeedbackMessage(
      characterRank as CharacterRank,
      subscriptionPlan as SubscriptionPlan,
      focusState as FocusState,
      distractedSubtype as DistractedSubtype
    );
    if (!message) {
      return res.status(404).json({ message: '反馈消息未找到' });
    }
    res.json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertFeedbackMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await configManagerService.upsertFeedbackMessage(req.body);
    res.json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFeedbackMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await configManagerService.deleteFeedbackMessage(parseInt(id));
    res.status(200).json({ message: '反馈消息删除成功' });
  } catch (error: any) {
    console.error('删除反馈消息失败:', error);
    res.status(500).json({ message: '删除反馈消息失败', error: error.message });
  }
};

/**
 * 初始化反馈消息配置（管理员手动强制重新初始化）
 * @param req 请求对象
 * @param res 响应对象
 */
export const initializeFeedbackMessages = async (req: Request, res: Response) => {
  try {
    await configManagerService.reinitializeFeedbackMessages();
    res.status(200).json({ message: '反馈消息初始化成功' });
  } catch (error: any) {
    console.error('初始化反馈消息失败:', error);
    res.status(500).json({ message: '初始化反馈消息失败', error: error.message });
  }
};