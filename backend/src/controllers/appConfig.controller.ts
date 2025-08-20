import { Request, Response, NextFunction } from 'express';
import { AppConfig, User, Subscription, AiPromptConfig } from '../models';
import { AuthenticatedRequest, getPlanDetails } from '../types';
import { SubscriptionPlan } from '../types/subscription';
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
            config.planIntervals = {};
            aiPromptConfigs.forEach(promptConfig => {
                if (promptConfig.subscriptionPlan && promptConfig.analysisIntervalSeconds) {
                    config.planIntervals[promptConfig.subscriptionPlan] = promptConfig.analysisIntervalSeconds;
                }
            });
            console.log('getAppConfig - 设置planIntervals:', JSON.stringify(config.planIntervals));
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
                    config.analysisIntervalSeconds = aiPromptConfig.analysisIntervalSeconds;
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
