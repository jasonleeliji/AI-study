import { Request, Response, NextFunction } from 'express';
import configManagerService from '../services/configManager.service';
import { SubscriptionPlan, CharacterRank, StudyState, FocusState, DistractedSubtype } from '../types/character';
import { AppConfig, AiPromptConfig } from '../models';

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

// ==================== UI文本配置管理 ====================

export const getUITextConfigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await configManagerService.getAllUITextConfigs();
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUITextConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionPlan } = req.params;
    const config = await configManagerService.getUITextConfig(subscriptionPlan);
    if (!config) {
      return res.status(404).json({ message: 'UI文本配置未找到' });
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertUITextConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await configManagerService.upsertUITextConfig(req.body);
    res.json(config);
  } catch (error: any) {
    console.error('保存UI文本配置失败:', error);
    res.status(500).json({ message: '保存UI文本配置失败', error: error.message });
  }
};

export const deleteUITextConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await configManagerService.deleteUITextConfig(parseInt(id));
    res.status(200).json({ message: 'UI文本配置删除成功' });
  } catch (error: any) {
    console.error('删除UI文本配置失败:', error);
    res.status(500).json({ message: '删除UI文本配置失败', error: error.message });
  }
};

export const initializeUITextConfigs = async (req: Request, res: Response) => {
  try {
    await configManagerService.initializeDefaultUITextConfigs();
    res.status(200).json({ message: 'UI文本配置初始化成功' });
  } catch (error: any) {
    console.error('初始化UI文本配置失败:', error);
    res.status(500).json({ message: '初始化UI文本配置失败', error: error.message });
  }
};