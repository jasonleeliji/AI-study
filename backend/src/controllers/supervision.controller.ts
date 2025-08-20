import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { analyzeImageWithAI } from '../services/qwen.service';
import { ChildProfile, StudySession, AppConfig, Subscription, User, AiPromptConfig } from '../models';
import { StudyState, FocusState, CharacterRank, SubscriptionPlan } from '../types/character';
import { StudyStatus } from '../types/studySession';
import { sendSessionUpdateToUser, sendProfileUpdateToUser } from '../services/realtime.service';
import { Op } from 'sequelize';

// 从应用配置中获取游戏化阶段目标
const getGameStageGoals = async () => {
  const appConfig = await AppConfig.findOne();
  return {
    STONE_MONKEY_GOAL_TOKENS: appConfig?.stoneMonkeyGoalTokens || 1000,
    CAVE_MASTER_GOAL_TOKENS: appConfig?.caveMasterGoalTokens || 5000,
    MONKEY_KING_GOAL_TOKENS: appConfig?.monkeyKingGoalTokens || 10000,
    TOTAL_MONKEY_KING_GOAL_TOKENS: appConfig?.totalMonkeyKingGoalTokens || 20000,
  };
};

const calculateRank = (focusHistory: { isFocused: boolean, isOnSeat: boolean }[], currentRank: CharacterRank): CharacterRank => {
    // 只保留悟空角色，所有情况都返回悟空
    return CharacterRank.WUKONG;
};

export const analyzeImage = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const { base64Image } = (req as any).body;

  if (!base64Image) {
    return (res as any).status(400).json({ message: '图像数据是必需的' });
  }

  try {
    const profile = await ChildProfile.findOne({ where: { userId: authReq.user!.id } });
    if (!profile) {
        return (res as any).status(404).json({ message: '未找到子用户档案' });
    }
    
    const activeSession = await StudySession.findOne({ 
        where: { 
            userId: authReq.user!.id, 
            status: { [Op.in]: [StudyStatus.Studying, StudyStatus.Break] }
        }
    });

    if (!activeSession) {
        return (res as any).status(404).json({ message: '未找到活跃的学习会话，无法进行分析' });
    }

    activeSession.lastActivity = new Date();

    if (activeSession.status === StudyStatus.Studying) {
      const user = await User.findByPk(authReq.user!.id, {
        include: [{ model: Subscription, as: 'subscription' }]
      });

      let subscriptionPlan: SubscriptionPlan;
      const subscription = user?.subscription;
      const hasActiveSubscription = subscription && subscription.endDate > new Date();
      const isTrialActive = user?.trialEndDate && user.trialEndDate > new Date();
      
      if (hasActiveSubscription && subscription.plan === 'pro') {
        subscriptionPlan = SubscriptionPlan.PRO;
      } else if (isTrialActive) {
        subscriptionPlan = SubscriptionPlan.TRIAL;
      } else {
        subscriptionPlan = SubscriptionPlan.STANDARD;
      }

      const aiPromptConfig = await AiPromptConfig.findOne({ where: { subscriptionPlan } });
      let analysisIntervalSeconds: number;

      if (aiPromptConfig && aiPromptConfig.analysisIntervalSeconds) {
        analysisIntervalSeconds = aiPromptConfig.analysisIntervalSeconds;
        console.log(`Using plan-specific database config for ${subscriptionPlan}: ${analysisIntervalSeconds}s`);
      } else {
        switch (subscriptionPlan) {
          case SubscriptionPlan.TRIAL: analysisIntervalSeconds = 15; break;
          case SubscriptionPlan.STANDARD: analysisIntervalSeconds = 30; break;
          case SubscriptionPlan.PRO: analysisIntervalSeconds = 15; break;
          default: analysisIntervalSeconds = 20; break;
        }
        console.log(`Using hardcoded fallback for ${subscriptionPlan}: ${analysisIntervalSeconds}s`);
      }

      const { analysis, usage } = await analyzeImageWithAI(base64Image, profile, activeSession.currentRank || CharacterRank.WUKONG, authReq.user!.id as string, activeSession.id as any);
      
      if (analysis.isFocused && analysis.isOnSeat && usage && usage.totalTokens > 0) {
        profile.dailySpiritualPower = (profile.dailySpiritualPower || 0) + usage.totalTokens;
        profile.totalSpiritualPower = (profile.totalSpiritualPower || 0) + usage.totalTokens;
        
        const stageGoals = await getGameStageGoals();
        if (profile.gamificationStage === 'STONE_MONKEY' && (profile.totalSpiritualPower || 0) >= stageGoals.STONE_MONKEY_GOAL_TOKENS) {
          profile.gamificationStage = 'CAVE_MASTER';
        } else if (profile.gamificationStage === 'CAVE_MASTER' && (profile.totalSpiritualPower || 0) >= stageGoals.CAVE_MASTER_GOAL_TOKENS) {
          profile.gamificationStage = 'MONKEY_KING';
        } else if (profile.gamificationStage === 'MONKEY_KING' && (profile.totalSpiritualPower || 0) >= stageGoals.MONKEY_KING_GOAL_TOKENS) {
          profile.gamificationStage = 'TOTAL_MONKEY_KING';
        }
        
        await profile.save();
        
        sendProfileUpdateToUser(authReq.user!.id, profile);
        
        console.log(`实时更新灵力值: 用户${authReq.user!.id}, 本次获得${usage.totalTokens}灵力, 总灵力值: ${profile.totalSpiritualPower}`);
      }
      
      const focusHistory = activeSession.focusHistory || [];
      focusHistory.push({
          timestamp: new Date(),
          isFocused: analysis.isFocused,
          isOnSeat: analysis.isOnSeat,
      });
      activeSession.focusHistory = focusHistory;

      const newRank = calculateRank(activeSession.focusHistory as { isFocused: boolean, isOnSeat: boolean }[], activeSession.currentRank || CharacterRank.WUKONG);
      activeSession.currentRank = newRank;
      analysis.currentRank = newRank;

      let feedbackMessage = "";
      const now = new Date();
      const appConfig = await AppConfig.findOne();

      if (!analysis.isOnSeat) {
          feedbackMessage = "要回来继续学习了吗？座位在等你呢！😊";
          analysis.animationKey = 'off_seat';
          activeSession.consecutiveDistractions = 0;
          activeSession.lastFocusTime = now;
      } else if (!analysis.isFocused) {
          activeSession.consecutiveDistractions = (activeSession.consecutiveDistractions || 0) + 1;
          activeSession.lastFocusTime = now;
          
          const distractionThreshold = Math.max(1, Math.round(60 / analysisIntervalSeconds));
          if ((activeSession.consecutiveDistractions || 0) >= distractionThreshold) {
              feedbackMessage = analysis.message;
              activeSession.consecutiveDistractions = 0;
          }
      } else {
          activeSession.consecutiveDistractions = 0;
          
          const positiveFeedbackMillis = (appConfig?.positiveFeedbackMinutes || 5) * 60 * 1000;

          if (now.getTime() - new Date(activeSession.lastFocusTime || now).getTime() >= positiveFeedbackMillis &&
              now.getTime() - new Date(activeSession.lastPositiveFeedbackTime || now).getTime() >= positiveFeedbackMillis) 
          {
              feedbackMessage = analysis.message;
              activeSession.lastPositiveFeedbackTime = now;
              activeSession.lastFocusTime = now;
          }
      }
      
      await activeSession.save();
      
      if (feedbackMessage) {
          analysis.message = feedbackMessage;
          (analysis as any).shouldSpeak = true;
      } else {
          (analysis as any).shouldSpeak = false;
      }

      (analysis as any).analysisIntervalSeconds = analysisIntervalSeconds;

      sendSessionUpdateToUser(authReq.user!.id, activeSession, usage);

      res.json({ analysis, usage });

    } else { // On break
        const breakAnalysis = await analyzeImageWithAI(base64Image, profile, activeSession.currentRank || CharacterRank.WUKONG, authReq.user!.id as string, activeSession.id as any);
        await activeSession.save();
        sendSessionUpdateToUser(authReq.user!.id, activeSession, breakAnalysis.usage);
        res.json(breakAnalysis);
    }

  } catch (error) {
    next(error);
  }
};
