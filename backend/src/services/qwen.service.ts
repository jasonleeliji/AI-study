import axios from 'axios';
import config from '../config';
import { ChildProfile } from '../models/childProfile.model';
import { User } from '../models/user.model';
import { Subscription } from '../models/subscription.model';
import { TokenUsage as TokenUsageModel } from '../models/tokenUsage.model';
import { ConfigManagerService } from './configManager.service';
import { CharacterRank, SubscriptionPlan, StudyState, FocusState, DistractedSubtype } from '../types/character';
import { IChildProfile } from '../types/childProfile.types';

interface AnalysisResult {
    isFocused: boolean;
    isOnSeat: boolean;
    animationKey: 'idle' | 'distracted' | 'off_seat';
    message: string;
    currentRank: CharacterRank;
    distractedSubtype?: DistractedSubtype;
}

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

// 创建 ConfigManagerService 实例
const configManagerService = new ConfigManagerService();

const getAnimationResponse = async (
    rank: CharacterRank, 
    isFocused: boolean, 
    isOnSeat: boolean, 
    userId: string,
    userSubscriptionInfo?: { hasActiveSubscription: boolean, plan?: string, isTrialActive: boolean },
    distractedSubtype?: DistractedSubtype
): Promise<{ animationKey: AnalysisResult['animationKey'], message: string }> => {
    
    // 确定专注状态
    let focusState: FocusState;
    if (!isOnSeat) {
        focusState = FocusState.OFF_SEAT;
    } else if (isFocused) {
        focusState = FocusState.FOCUSED;
    } else {
        focusState = FocusState.DISTRACTED;
    }

    // 确定订阅计划
    let subscriptionPlan: SubscriptionPlan;
    if (userSubscriptionInfo?.hasActiveSubscription && userSubscriptionInfo?.plan === 'pro') {
        subscriptionPlan = SubscriptionPlan.PRO;
    } else if (userSubscriptionInfo?.isTrialActive) {
        subscriptionPlan = SubscriptionPlan.TRIAL;
    } else {
        subscriptionPlan = SubscriptionPlan.STANDARD;
    }

    // 确定动画键
    let animationKey: AnalysisResult['animationKey'];
    if (!isOnSeat) {
        animationKey = 'off_seat';
    } else if (isFocused) {
        animationKey = 'idle';
    } else {
        animationKey = 'distracted';
    }

    try {
        // 从数据库获取反馈消息
        console.log(`=== 获取反馈消息 (用户ID: ${userId}) ===`);
        console.log(`角色等级: ${rank}`);
        console.log(`订阅计划: ${subscriptionPlan}`);
        console.log(`专注状态: ${focusState}`);
        console.log(`分心子类型: ${distractedSubtype || 'undefined'}`);
        
        const feedbackMessage = await configManagerService.getFeedbackMessage(
            rank,
            subscriptionPlan,
            focusState,
            distractedSubtype
        );

        console.log(`获取到的反馈消息: ${feedbackMessage || '无消息'}`);
        console.log(`=== 反馈消息获取结束 ===`);

        return {
            animationKey,
            message: feedbackMessage || '继续努力学习吧！'
        };
    } catch (error) {
        console.error('Failed to get feedback message from database:', error);
        
        // 降级到默认消息
        const defaultMessages = {
            [FocusState.FOCUSED]: '很好，继续保持专注！',
            [FocusState.DISTRACTED]: '注意力要集中哦！',
            [FocusState.OFF_SEAT]: '快回到座位上继续学习吧！'
        };

        return {
            animationKey,
            message: defaultMessages[focusState]
        };
    }
};

export const analyzeImageWithAI = async (
  base64Image: string,
  profile: IChildProfile,
  currentRank: CharacterRank,
  userId: string,
  sessionId?: number,
): Promise<{ analysis: AnalysisResult, usage: TokenUsage }> => {
  
  // Clean base64 data - remove data URL prefix if present
  let cleanBase64 = base64Image;
  if (base64Image.includes(',')) {
    cleanBase64 = base64Image.split(',')[1];
  }
  
  console.log('Received base64Image length:', base64Image.length);
  console.log('Base64 length after cleaning:', cleanBase64.length);
  console.log('Base64 starts with:', cleanBase64.substring(0, 50));
  console.log('Starting AI analysis for profile:', profile.nickname);
  
  // 获取用户订阅信息以确定使用的提示词
  const user = await User.findByPk(userId, { include: [{ model: Subscription, as: 'subscription' }] });
  
  // 判断用户订阅版本
  const sub = user?.subscription as any;
  const now = new Date();
  const hasActiveSubscription = sub && sub.status === 'active' && sub.endDate && sub.endDate > now;
  const isTrialActive = user?.trialEndDate && user.trialEndDate > now;
  
  // 确定订阅计划
  let subscriptionPlan: SubscriptionPlan;
  if (hasActiveSubscription && sub.plan === 'pro') {
    subscriptionPlan = SubscriptionPlan.PRO;
  } else if (isTrialActive) {
    subscriptionPlan = SubscriptionPlan.TRIAL;
  } else {
    subscriptionPlan = SubscriptionPlan.STANDARD;
  }

  // 从数据库获取AI提示配置
  const aiPromptConfig = await configManagerService.getAiPromptConfig(subscriptionPlan);
  
  let prompt: string;
  let maxTokens: number;

  if (aiPromptConfig) {
    prompt = aiPromptConfig.promptTemplate;
    maxTokens = aiPromptConfig.maxTokens || 150;
    console.log(`=== AI提示词配置 (用户ID: ${userId}, 订阅计划: ${subscriptionPlan}) ===`);
    console.log(`提示词长度: ${prompt.length} 字符`);
    console.log(`最大Token数: ${maxTokens}`);
    console.log(`提示词内容:\n${prompt}`);
    console.log(`=== AI提示词配置结束 ===`);
  } else {
    // 降级到默认配置
    const unifiedPrompt = `你是一位儿童行为分析专家。请分析儿童学习图像，判断是否专注、是否在座。

### 判断标准
1.  **在座 (isOnSeat)**:
    - \`true\`: 儿童头部/躯干在画面内，且未趴睡。
    - \`false\`: 完全离开或趴睡。

2.  **专注 (isFocused)**: 遵循"疑罪从无"原则。
    - \`true\`: 埋头读写、动手学习、凝视思考、短暂思考、无意识小动作、短暂视线转移。
    - \`false\`: **仅在明确观察到以下行为时**：玩弄无关物品、视线长期偏离、明显发呆/走神、与人互动、趴睡或离座。

3.  **分心类型 (distractedSubtype)**: 如果\`isFocused\`为\`false\`，请指定分心类型。
    - \`play\`: 玩弄无关物品 (手机、玩具、零食等)。
    - \`distracted\`: 视线长期偏离学习区。
    - \`zone\`: 明显发呆、走神。
    - \`talk\`: 与人互动、说话。
    - \`sleep\`: 趴睡。

### 输出要求
严格返回JSON对象，无任何额外解释或Markdown标记。

示例:
{"isFocused": true, "isOnSeat": true, "distractedSubtype": "distracted"}`;

    if (subscriptionPlan === SubscriptionPlan.PRO || subscriptionPlan === SubscriptionPlan.TRIAL) {
      prompt = unifiedPrompt;
      maxTokens = 150;
    } else {
      // 标准版使用简化的提示词，但支持分心子类型识别
      prompt = `分析图像，判断儿童学习状态（上半身视角）。
输出格式: 严格JSON: {"isFocused": <bool>, "isOnSeat": <bool>, "distractedSubtype": "<type>"}，无解释。

判断依据:
- isOnSeat: true=人像在框内且未趴下 | false=无人或完全趴在桌上
- isFocused: true=低头看桌面/写字 | false=扭头,抬头看远处,直视镜头,玩耍
- distractedSubtype: 分心时选择: "play"(玩物品), "distracted"(视线偏离), "zone"(发呆), "talk"(互动), "sleep"(趴睡)`;
      maxTokens = 150;
    }
  }

  let partialAnalysis: { isFocused: boolean, isOnSeat: boolean };
  let usageData: any;
  let cleanedOutputText: string;

  const requestBody = {
      model: "qwen-vl-plus",
      messages: [
          {
              role: "user",
              content: [
                  {
                      type: "image_url",
                      image_url: {
                          url: `data:image/jpeg;base64,${cleanBase64}`
                      }
                  },
                  {
                      type: "text",
                      text: prompt
                  }
              ]
          }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
  };

    try {
        // 使用OpenAI兼容模式调用Qwen VL模型
        const response = await axios.post(`${config.qwenApiBaseUrl}/chat/completions`, requestBody, {
            headers: { 'Authorization': `Bearer ${config.qwenApiKey}`, 'Content-Type': 'application/json' }
        });
        
        const outputText = response.data.choices[0].message.content;
        console.log('Raw Qwen API response:', outputText);
        
        // Clean up the output to ensure it's valid JSON
        cleanedOutputText = outputText.trim();
        if (cleanedOutputText.startsWith('```json')) {
            cleanedOutputText = cleanedOutputText.substring(7);
        }
        if (cleanedOutputText.endsWith('```')) {
            cleanedOutputText = cleanedOutputText.slice(0, -3);
        }
        cleanedOutputText = cleanedOutputText.trim();
        
        try {
            const rawAnalysis = JSON.parse(cleanedOutputText);
            console.log('Raw analysis from Qwen API:', JSON.stringify(rawAnalysis));
            
            // Handle potential field name issues (e.g., ".isOnSeat" instead of "isOnSeat")
            partialAnalysis = {
                isFocused: rawAnalysis.isFocused,
                isOnSeat: rawAnalysis.isOnSeat || rawAnalysis['.isOnSeat'] // Handle the malformed field name
            };
            
            console.log('Processed analysis after field cleanup:', JSON.stringify(partialAnalysis));
            
            // Clean up any undefined values
            if (partialAnalysis.isFocused === undefined) {
                partialAnalysis.isFocused = rawAnalysis['.isFocused'] || false;
                console.log('Fixed undefined isFocused field');
            }
            if (partialAnalysis.isOnSeat === undefined) {
                partialAnalysis.isOnSeat = false;
                console.log('Fixed undefined isOnSeat field');
            }
            
            console.log('Final analysis after all fixes:', JSON.stringify(partialAnalysis));
            
        } catch (parseError: any) {
            throw new Error(`Failed to parse Qwen API response as JSON. Response text: ${cleanedOutputText}. Parse error: ${parseError.message}`);
        }

        if (typeof partialAnalysis.isFocused !== 'boolean' || typeof partialAnalysis.isOnSeat !== 'boolean') {
            console.error('Field validation failed:', {
                isFocused: { value: partialAnalysis.isFocused, type: typeof partialAnalysis.isFocused },
                isOnSeat: { value: partialAnalysis.isOnSeat, type: typeof partialAnalysis.isOnSeat }
            });
            throw new Error(`Qwen API response missing required fields. Response: ${JSON.stringify(partialAnalysis)}`);
        }

        usageData = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        console.log('AI analysis completed successfully:', { partialAnalysis, usage: usageData });

    } catch (error: any) {
        console.error("Error calling Qwen API:");
        console.error("Status:", error.response?.status);
        console.error("Status Text:", error.response?.statusText);
        console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("Request Config:", JSON.stringify({
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
        }, null, 2));
        console.error("Full error:", error.message);
        throw new Error(`AI分析失败: ${error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Unknown error'}`);
    }

    const userSubscriptionInfo = {
        hasActiveSubscription,
        plan: sub?.plan || 'none',
        isTrialActive: isTrialActive || false
    };
    
    // 处理分心子类型
    let distractedSubtype: DistractedSubtype | undefined;
    if (!partialAnalysis.isFocused) {
        // 从原始分析结果中获取分心子类型
        const rawAnalysis = JSON.parse(cleanedOutputText);
        if (rawAnalysis.distractedSubtype) {
            const subtypeMapping: Record<string, DistractedSubtype> = {
                'play': DistractedSubtype.PLAY,
                'distracted': DistractedSubtype.DISTRACTED,
                'zone': DistractedSubtype.ZONE,
                'talk': DistractedSubtype.TALK,
                'sleep': DistractedSubtype.SLEEP,
                '玩弄物品': DistractedSubtype.PLAY,
                '视线偏离': DistractedSubtype.DISTRACTED,
                '发呆走神': DistractedSubtype.ZONE,
                '与人互动': DistractedSubtype.TALK,
                '趴睡': DistractedSubtype.SLEEP
            };
            
            distractedSubtype = subtypeMapping[rawAnalysis.distractedSubtype.toLowerCase()] || DistractedSubtype.DISTRACTED;
        } else {
            distractedSubtype = DistractedSubtype.DISTRACTED;
        }
    }

    const { animationKey, message } = await getAnimationResponse(currentRank, partialAnalysis.isFocused, partialAnalysis.isOnSeat, userId, userSubscriptionInfo, distractedSubtype);
    
    const analysis: AnalysisResult = { 
        ...partialAnalysis, 
        animationKey,
        message,
        currentRank,
        distractedSubtype
    };

    const usage: TokenUsage = {
        inputTokens: usageData.prompt_tokens || usageData.input_tokens || 0,
        outputTokens: usageData.completion_tokens || usageData.output_tokens || 0,
        totalTokens: usageData.total_tokens || ((usageData.prompt_tokens || usageData.input_tokens || 0) + (usageData.completion_tokens || usageData.output_tokens || 0)),
    };

    // 保存token使用记录到数据库
    try {
        await TokenUsageModel.create({
            userId: parseInt(userId),
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens: usage.totalTokens,
            sessionId: sessionId || null,
            isFocused: partialAnalysis.isFocused, // 记录专注状态
        });

        // 更新用户累计token使用量
        const user = await User.findByPk(parseInt(userId));
        if (user) {
            user.totalTokensUsed = (user.totalTokensUsed || 0) + usage.totalTokens;
            await user.save();
        }

        console.log('Token usage saved:', usage);
    } catch (error) {
        console.error('Failed to save token usage:', error);
    }

    return { analysis, usage };
};
