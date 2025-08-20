import path from 'path';
import fs from 'fs';
import { IFeedbackMessage } from '../models';
import { CharacterRank, SubscriptionPlan, StudyState, FocusState, DistractedSubtype } from '../types/character';

/**
 * 从MD文件解析反馈消息数据
 */
export async function initializeFeedbackFromMd(): Promise<Partial<IFeedbackMessage>[]> {
  try {
    const filePath = path.join(__dirname, '..', '唐僧、观音反馈文案.md');
    console.log('读取文件:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const feedbackData = JSON.parse(fileContent);
    
    const feedbackMessages: Partial<IFeedbackMessage>[] = [];

    // 处理专业版数据（pro）
    if (feedbackData.pro && feedbackData.pro.wukong) {
      const proData = feedbackData.pro.wukong;
      
      // 专业版订阅计划
      const proMessages = createMessagesForPlan(proData, SubscriptionPlan.PRO);
      feedbackMessages.push(...proMessages);
      
      // 试用版使用相同的专业版数据
      const trialMessages = createMessagesForPlan(proData, SubscriptionPlan.TRIAL);
      feedbackMessages.push(...trialMessages);
    }

    // 处理标准版数据（standard）
    if (feedbackData.standard && feedbackData.standard.wukong) {
      const standardData = feedbackData.standard.wukong;
      const standardMessages = createMessagesForPlan(standardData, SubscriptionPlan.STANDARD);
      feedbackMessages.push(...standardMessages);
    }

    console.log(`解析完成，共生成 ${feedbackMessages.length} 条反馈消息`);
    return feedbackMessages;
    
  } catch (error) {
    console.error('从MD文件初始化反馈消息失败:', error);
    throw error;
  }
}

/**
 * 为指定订阅计划创建反馈消息
 */
function createMessagesForPlan(data: any, subscriptionPlan: SubscriptionPlan): Partial<IFeedbackMessage>[] {
  const messages: Partial<IFeedbackMessage>[] = [];
  
  // 状态映射
  const stateMapping = [
    { key: 'focused', studyState: FocusState.FOCUSED },
    { key: 'off_seat', studyState: FocusState.OFF_SEAT },
    { key: 'play', studyState: FocusState.DISTRACTED, distractedSubtype: DistractedSubtype.PLAY },
    { key: 'distracted', studyState: FocusState.DISTRACTED, distractedSubtype: DistractedSubtype.DISTRACTED },
    { key: 'zone', studyState: FocusState.DISTRACTED, distractedSubtype: DistractedSubtype.ZONE },
    { key: 'talk', studyState: FocusState.DISTRACTED, distractedSubtype: DistractedSubtype.TALK },
    { key: 'sleep', studyState: FocusState.DISTRACTED, distractedSubtype: DistractedSubtype.SLEEP }
  ];

  stateMapping.forEach(stateInfo => {
    if (data[stateInfo.key] && Array.isArray(data[stateInfo.key])) {
      const messageTexts = data[stateInfo.key].filter((msg: string) => msg && msg.trim());
      
      if (messageTexts.length > 0) {
        const feedbackMessage: Partial<IFeedbackMessage> = {
          characterRank: CharacterRank.WUKONG,
          subscriptionPlan: subscriptionPlan,
          studyState: stateInfo.studyState,
          messages: messageTexts,
          audioUrls: new Array(messageTexts.length).fill(''), // 初始化空的语音URL数组
          isActive: true
        };

        // 如果有分心子类型，添加到消息中
        if (stateInfo.distractedSubtype) {
          feedbackMessage.distractedSubtype = stateInfo.distractedSubtype;
        }

        messages.push(feedbackMessage);
        
        console.log(`创建反馈消息: ${subscriptionPlan} - ${stateInfo.studyState}${stateInfo.distractedSubtype ? ` (${stateInfo.distractedSubtype})` : ''} - ${messageTexts.length}条消息`);
      }
    }
  });

  return messages;
}