import { 
  SubscriptionPlan, 
  CharacterRank,
  StudyState,
  FocusState, 
  DistractedSubtype
} from '../types/character';
import FeedbackMessage, { IFeedbackMessage } from '../models/feedbackMessage.model';
import AiPromptConfig, { IAiPromptConfig } from '../models/aiPromptConfig.model';
import { AppConfig } from '../models/appConfig.model';
import { CharacterConfig } from '../models/characterConfig.model';
import { Op } from 'sequelize';

export class ConfigManagerService {
  // ==================== 反馈消息管理 ====================
  
  /**
   * 获取反馈消息
   */
  async getFeedbackMessage(
    characterRank: CharacterRank,
    subscriptionPlan: SubscriptionPlan,
    focusState: FocusState,
    distractedSubtype?: DistractedSubtype
  ): Promise<string | null> {
    console.log(`=== getFeedbackMessage 查询开始 ===`);
    console.log(`查询参数: characterRank=${characterRank}, subscriptionPlan=${subscriptionPlan}, focusState=${focusState}, distractedSubtype=${distractedSubtype}`);
    
    // 对于试用版和标准版的分心状态，从所有分心反馈词中随机选择
    if ((subscriptionPlan === SubscriptionPlan.TRIAL || subscriptionPlan === SubscriptionPlan.STANDARD) 
        && focusState === FocusState.DISTRACTED) {
      
      console.log('使用试用版/标准版分心状态逻辑');
      
      // 获取该角色、订阅计划、专注状态下的所有分心反馈消息
      const query = {
        where: {
          characterRank,
          subscriptionPlan,
          studyState: FocusState.DISTRACTED,
          isActive: true
        }
      };
      console.log('查询条件:', JSON.stringify(query));
      
      const allDistractedFeedbacks = await FeedbackMessage.findAll(query);
      console.log(`找到 ${allDistractedFeedbacks.length} 条分心反馈消息`);
      
      if (allDistractedFeedbacks && allDistractedFeedbacks.length > 0) {
        // 收集所有反馈消息
        const allMessages: string[] = [];
        allDistractedFeedbacks.forEach((feedback: FeedbackMessage) => {
          console.log(`反馈消息ID: ${feedback.id}, 消息数量: ${feedback.messages?.length || 0}`);
          if (feedback.messages && feedback.messages.length > 0) {
            allMessages.push(...feedback.messages);
          }
        });
        
        console.log(`总共收集到 ${allMessages.length} 条消息`);
        
        if (allMessages.length > 0) {
          // 从所有分心反馈消息中随机选择一条
          const randomIndex = Math.floor(Math.random() * allMessages.length);
          const selectedMessage = allMessages[randomIndex];
          console.log(`随机选择索引: ${randomIndex}, 选中消息: ${selectedMessage}`);
          console.log(`=== getFeedbackMessage 查询结束 (成功) ===`);
          return selectedMessage;
        }
      }
      
      console.log('未找到合适的分心反馈消息');
      console.log(`=== getFeedbackMessage 查询结束 (无结果) ===`);
      return null;
    }
    
    console.log('使用专业版或非分心状态逻辑');
    
    // 对于专业版或非分心状态，使用原有的精确匹配逻辑
    const query: any = { 
      where: {
        characterRank,
        subscriptionPlan,
        studyState: focusState,
        isActive: true
      }
    };
    
    if (distractedSubtype && subscriptionPlan === SubscriptionPlan.PRO) {
      query.where.distractedSubtype = distractedSubtype;
    }
    
    console.log('精确匹配查询条件:', JSON.stringify(query));
    
    const feedbackConfig = await FeedbackMessage.findOne(query);
    console.log(`精确匹配结果: ${feedbackConfig ? '找到' : '未找到'}`);
    
    if (feedbackConfig && feedbackConfig.messages.length > 0) {
      console.log(`找到反馈配置，消息数量: ${feedbackConfig.messages.length}`);
      // 随机选择一条消息
      const randomIndex = Math.floor(Math.random() * feedbackConfig.messages.length);
      const selectedMessage = feedbackConfig.messages[randomIndex];
      console.log(`随机选择索引: ${randomIndex}, 选中消息: ${selectedMessage}`);
      console.log(`=== getFeedbackMessage 查询结束 (成功) ===`);
      return selectedMessage;
    }
    
    console.log('未找到合适的反馈消息');
    console.log(`=== getFeedbackMessage 查询结束 (无结果) ===`);
    return null;
  }

  /**
   * 创建或更新反馈消息
   */
  async upsertFeedbackMessage(messageData: Partial<IFeedbackMessage>): Promise<FeedbackMessage> {
    const query: any = {
      where: {
        characterRank: messageData.characterRank,
        subscriptionPlan: messageData.subscriptionPlan,
        studyState: messageData.studyState
      }
    };

    if (messageData.distractedSubtype) {
      query.where.distractedSubtype = messageData.distractedSubtype;
    }

    const [instance, created] = await FeedbackMessage.findOrCreate({
      where: query.where,
      defaults: messageData,
    });

    if (!created) {
      await instance.update(messageData);
    }
    
    return instance;
  }

  /**
   * 批量创建反馈消息
   */
  async batchCreateFeedbackMessages(messagesData: Partial<IFeedbackMessage>[]): Promise<FeedbackMessage[]> {
    const results: FeedbackMessage[] = [];

    for (const messageData of messagesData) {
      const result = await this.upsertFeedbackMessage(messageData);
      results.push(result);
    }

    return results;
  }

  // ==================== AI提示词配置管理 ====================
  
  /**
   * 获取AI提示词配置
   */
  async getAiPromptConfig(subscriptionPlan: SubscriptionPlan): Promise<AiPromptConfig | null> {
    try {
      console.log(`=== 获取AI提示词配置 (订阅计划: ${subscriptionPlan}) ===`);

      // 查询所有配置以便调试
      const allConfigs = await AiPromptConfig.findAll({});
      console.log(`数据库中总共有 ${allConfigs.length} 个AI提示词配置:`);
      allConfigs.forEach((config: AiPromptConfig) => {
        console.log(`- 订阅计划: ${config.subscriptionPlan}, 激活状态: ${config.isActive}, ID: ${config.id}`);
      });

      const config = await AiPromptConfig.findOne({
        where: {
          subscriptionPlan,
          isActive: true
        }
      });

      if (config) {
        console.log(`找到匹配的AI提示词配置:`);
        console.log(`- 订阅计划: ${config.subscriptionPlan}`);
        console.log(`- 激活状态: ${config.isActive}`);
        console.log(`- 提示词长度: ${config.promptTemplate.length} 字符`);
        console.log(`- 最大Token数: ${config.maxTokens}`);
        console.log(`- 配置ID: ${config.id}`);
      } else {
        console.log(`未找到匹配的AI提示词配置 (订阅计划: ${subscriptionPlan}, 激活状态: true)`);
      }

      console.log(`=== AI提示词配置获取结束 ===`);
      return config;
    } catch (error) {
      console.error('获取AI提示词配置失败:', error);
      return null;
    }
  }

  /**
   * 创建或更新AI提示词配置
   */
  async upsertAiPromptConfig(configData: Partial<IAiPromptConfig>): Promise<AiPromptConfig> {
    // 如果configData.id存在，则为更新操作
    if (configData.id) {
      console.log(`正在更新AI提示词配置: ID=${configData.id}`);
      const instance = await AiPromptConfig.findByPk(configData.id);
      if (instance) {
        await instance.update(configData);
        console.log(`更新成功: ${instance.subscriptionPlan}`);
        return instance;
      }
      throw new Error(`未找到ID为 ${configData.id} 的配置`);
    } 
    // 否则为创建操作
    else {
      console.log(`正在创建新的AI提示词配置: ${configData.subscriptionPlan}`);
      // 确保创建时 analysisIntervalSeconds 有默认值
      const dataToCreate = {
        ...configData,
        analysisIntervalSeconds: configData.analysisIntervalSeconds ?? 30, // 提供默认值
      };
      const instance = await AiPromptConfig.create(dataToCreate);
      console.log(`创建成功: ${instance.subscriptionPlan}`);
      return instance;
    }
  }

  /**
   * 获取所有AI提示词配置
   */
  async getAllAiPromptConfigs(): Promise<AiPromptConfig[]> {
    const configs = await AiPromptConfig.findAll({ where: { isActive: true } });
    console.log('数据库中的AI提示词配置:');
    configs.forEach((config: any) => {
      console.log(`- ${config.subscriptionPlan}: ${config.analysisIntervalSeconds}秒`);
    });
    return configs;
  }

  /**
   * 删除AI提示词配置
   */
  async deleteAiPromptConfig(id: number): Promise<void> {
    await AiPromptConfig.update({ isActive: false }, { where: { id } });
  }

  /**
   * 获取所有反馈消息
   */
  async getAllFeedbackMessages(): Promise<IFeedbackMessage[]> {
    return await FeedbackMessage.findAll({ where: { isActive: true } });
  }

  /**
   * 根据ID获取反馈消息
   */
  async getFeedbackMessageById(id: number): Promise<FeedbackMessage | null> {
    return await FeedbackMessage.findByPk(id);
  }

  /**
   * 删除反馈消息
   */
  async deleteFeedbackMessage(id: number): Promise<void> {
    await FeedbackMessage.update({ isActive: false }, { where: { id } });
  }

  // ==================== 初始化默认配置 ====================
  
  /**
   * 初始化应用配置
   */
  private async initializeAppConfig(): Promise<void> {
    try {
      // 检查是否已存在AppConfig
      const existingConfig = await AppConfig.findOne();
      if (existingConfig) {
        console.log('AppConfig already exists, skipping initialization');
        return;
      }

      // 创建默认AppConfig
      await AppConfig.create({
        positiveFeedbackMinutes: 30,
        standardPlanPrice: 1990,
        proPlanPrice: 2990,
        stoneMonkeyGoalTokens: 100,
        caveMasterGoalTokens: 500,
        monkeyKingGoalTokens: 1000,
        totalMonkeyKingGoalTokens: 5000,
        wechatQrImageUrl: 'https://example.com/wechat-qr.png'
      });
      
      console.log('Default AppConfig initialized successfully');
    } catch (error) {
      console.error('Error initializing AppConfig:', error);
      throw error;
    }
  }

  /**
   * 初始化角色配置
   */
  private async initializeCharacterConfigs(): Promise<void> {
    try {
      // 检查是否已存在CharacterConfig
      const existingCount = await CharacterConfig.count({ where: { isActive: true } });
      if (existingCount > 0) {
        console.log(`CharacterConfig already exists (${existingCount} configs), skipping initialization`);
        return;
      }

      // 创建默认角色配置 - 逐个创建以避免唯一约束冲突
      const defaultCharacterConfigs = [
        {
          role: 'master',
          rank: 'WUKONG',
          gamificationStage: null,
          subscriptionPlan: 'trial',
          images: [],
          isActive: true
        },
        {
          role: 'master',
          rank: 'WUKONG',
          gamificationStage: null,
          subscriptionPlan: 'standard',
          images: [],
          isActive: true
        },
        {
          role: 'master',
          rank: 'WUKONG',
          gamificationStage: null,
          subscriptionPlan: 'pro',
          images: [],
          isActive: true
        },
        {
          role: 'student',
          rank: 'WUKONG',
          gamificationStage: 'STONE_MONKEY',
          subscriptionPlan: 'trial',
          images: [],
          isActive: true
        },
        {
          role: 'student',
          rank: 'WUKONG',
          gamificationStage: 'STONE_MONKEY',
          subscriptionPlan: 'standard',
          images: [],
          isActive: true
        },
        {
          role: 'student',
          rank: 'WUKONG',
          gamificationStage: 'STONE_MONKEY',
          subscriptionPlan: 'pro',
          images: [],
          isActive: true
        }
      ];

      // 逐个检查并创建，避免重复
      for (const config of defaultCharacterConfigs) {
        const existing = await CharacterConfig.findOne({
          where: {
            role: config.role,
            rank: config.rank,
            gamificationStage: config.gamificationStage,
            subscriptionPlan: config.subscriptionPlan
          }
        });
        
        if (!existing) {
          await CharacterConfig.create(config);
          console.log(`Created CharacterConfig: ${config.role}-${config.rank}-${config.gamificationStage || 'null'}-${config.subscriptionPlan}`);
        }
      }
      console.log(`Default CharacterConfig initialized successfully (${defaultCharacterConfigs.length} configs)`);
    } catch (error) {
      console.error('Error initializing CharacterConfig:', error);
      throw error;
    }
  }

  /**
   * 初始化默认配置数据
   */
  async initializeDefaultConfigs(): Promise<void> {
    await this.initializeAppConfig();
    await this.initializeCharacterConfigs();
    await this.initializeFeedbackMessages();
    await this.initializeAiPromptConfigs();
  }

  /**
   * 初始化反馈消息数据（仅在数据库为空时初始化）
   */
  async initializeFeedbackMessages(): Promise<void> {
    try {
      // 检查数据库中是否已有反馈消息
      const existingCount = await FeedbackMessage.count({ where: { isActive: true } });
      
      if (existingCount > 0) {
        console.log(`数据库中已存在 ${existingCount} 条反馈消息，跳过初始化`);
        return;
      }
      
      console.log('数据库中无反馈消息，开始初始化...');
      
      // 从MD文件导入反馈消息数据
      const { initializeFeedbackFromMd } = await import('../scripts/initializeFeedbackFromMd');
      const feedbackMessages = await initializeFeedbackFromMd();
      
      // 批量创建反馈消息
      await this.batchCreateFeedbackMessages(feedbackMessages);
      
      console.log(`成功初始化 ${feedbackMessages.length} 条反馈消息`);
    } catch (error) {
      console.error('初始化反馈消息失败:', error);
      throw error;
    }
  }

  /**
   * 重新初始化反馈消息数据（强制更新）
   */
  async reinitializeFeedbackMessages(): Promise<void> {
    try {
      console.log('开始重新初始化反馈消息数据...');
      
      // 清空现有反馈消息
      await FeedbackMessage.destroy({ where: { isActive: true } });
      console.log('已清空现有反馈消息');
      
      // 从MD文件导入反馈消息数据
        const { initializeFeedbackFromMd } = await import('../scripts/initializeFeedbackFromMd');
        const feedbackMessages = await initializeFeedbackFromMd();
      
      // 批量创建反馈消息
      await this.batchCreateFeedbackMessages(feedbackMessages);
      
      console.log(`成功重新初始化 ${feedbackMessages.length} 条反馈消息`);
    } catch (error) {
      console.error('重新初始化反馈消息失败:', error);
      throw error;
    }
  }

  private async initializeAiPromptConfigs(): Promise<void> {
    const defaultPromptConfigs: Partial<IAiPromptConfig>[] = [
      {
        subscriptionPlan: SubscriptionPlan.TRIAL,
        promptTemplate: `你是一位资深的儿童行为分析专家。你的任务是分析一张儿童学习图像，并根据行为标准判断。

### 分析标准
#### A. 专注 (true)
- 头部低垂，视线聚焦书本/屏幕。
- 身体端正，面向学习区。
- 手部书写/翻页等学习动作。
- 眼神集中注视材料。

#### B. 分心 (false)
1. play: 玩弄无关物品。
2. distracted: 视线偏离。
3. zone: 发呆走神。
4. talk: 与人互动。
5. sleep: 趴睡。

#### C. 离座
- 座位空置。

### 输出
{"isFocused": true/false, "isOnSeat": true/false, "distractedSubtype": "play/distracted/zone/talk/sleep" (分心时), "message": "简洁描述"}

### 注意
- 先判离座。
- 分心指定类型。
- 描述客观。`,
        maxTokens: 200,
        analysisIntervalSeconds: 60, // 试用版默认60秒
        analysisCategories: {
          focused: ['focused'],
          distracted: ['play', 'distracted', 'zone', 'talk', 'sleep'],
          offSeat: ['off-seat']
        },
        distractedSubtypes: {
          'play': { code: 'play', description: '玩弄无关物品' },
          'distracted': { code: 'distracted', description: '视线长期偏离' },
          'zone': { code: 'zone', description: '明显发呆/走神' },
          'talk': { code: 'talk', description: '与人互动' },
          'sleep': { code: 'sleep', description: '趴睡或离座' },
          'phone': { code: 'phone', description: '使用手机' },
          'eat': { code: 'eat', description: '进食' }
        }
      },
      {
        subscriptionPlan: SubscriptionPlan.STANDARD,
        promptTemplate: `你是一位资深的儿童行为分析专家。你的任务是分析一张儿童学习图像，并根据行为标准判断。

### 分析标准
#### A. 专注
- 头部低垂，视线聚焦。
- 身体端正。
- 手部学习动作。

#### B. 分心
- 视线偏离。
- 玩弄物品。
- 发呆。
- 与人互动。

#### C. 离座
- 座位空置。

输出: {"isFocused": true/false, "isOnSeat": true/false, "message": "行为描述"}`,
        maxTokens: 150,
        analysisIntervalSeconds: 30, // 标准版默认30秒
        analysisCategories: {
          focused: ['focused'],
          distracted: ['play', 'distracted', 'zone', 'talk', 'sleep'],
          offSeat: ['off-seat']
        },
        distractedSubtypes: {
          'play': { code: 'play', description: '玩弄无关物品' },
          'distracted': { code: 'distracted', description: '视线长期偏离' },
          'zone': { code: 'zone', description: '明显发呆/走神' },
          'talk': { code: 'talk', description: '与人互动' },
          'sleep': { code: 'sleep', description: '趴睡或离座' },
          'phone': { code: 'phone', description: '使用手机' }
        }
      },
      {
        subscriptionPlan: SubscriptionPlan.PRO,
        promptTemplate: `你是一位资深的儿童行为分析专家。你的任务是分析一张儿童学习图像，并根据行为标准判断。

### 分析标准
#### A. 专注 (true)
- 头部低垂，视线聚焦书本/屏幕。
- 身体端正，面向学习区。
- 手部书写/翻页等学习动作。
- 眼神集中注视材料。

#### B. 分心 (false)
1. play: 玩弄无关物品。
2. distracted: 视线偏离。
3. zone: 发呆走神。
4. talk: 与人互动。
5. sleep: 趴睡。

#### C. 离座
- 座位空置。

### 输出
{"isFocused": true/false, "isOnSeat": true/false, "distractedSubtype": "play/distracted/zone/talk/sleep" (分心时), "message": "简洁描述"}

### 注意
- 先判离座。
- 分心指定类型。
- 描述客观。`,
        maxTokens: 200,
        analysisIntervalSeconds: 15, // 专业版默认15秒
        analysisCategories: {
          focused: ['focused'],
          distracted: ['play', 'distracted', 'zone', 'talk', 'sleep'],
          offSeat: ['off-seat']
        },
        distractedSubtypes: {
          'play': { code: 'play', description: '玩弄无关物品' },
          'distracted': { code: 'distracted', description: '视线长期偏离' },
          'zone': { code: 'zone', description: '明显发呆/走神' },
          'talk': { code: 'talk', description: '与人互动' },
          'sleep': { code: 'sleep', description: '趴睡或离座' },
          'phone': { code: 'phone', description: '使用手机' },
          'eat': { code: 'eat', description: '进食' }
        }
      }
    ];

    for (const config of defaultPromptConfigs) {
      // 检查该订阅计划的配置是否已存在
      const existingConfig = await AiPromptConfig.findOne({ where: { subscriptionPlan: config.subscriptionPlan } });
      // 如果不存在，则创建默认配置
      if (!existingConfig) {
        await this.upsertAiPromptConfig(config);
        console.log(`Created default AI prompt config for ${config.subscriptionPlan} with interval: ${config.analysisIntervalSeconds}s`);
      } else {
        console.log(`AI prompt config for ${config.subscriptionPlan} already exists with interval: ${existingConfig.analysisIntervalSeconds}s`);
      }
    }
    console.log('AI prompt config initialization check complete.');
  }
}

export default new ConfigManagerService();
