import { connectDB, sequelize } from '../config/db';
import { User, Subscription, FeedbackMessage, CharacterConfig } from '../models';
import { CharacterRank, SubscriptionPlan } from '../types/character';
import { Op } from 'sequelize';

async function connectToDatabase() {
  try {
    await connectDB();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

async function verifyDatabase() {
  console.log('🔍 开始验证数据库状态...');
  console.log('=====================================');
  
  try {
    // 1. 检查用户和订阅状态
    const totalUsers = await User.count();
    const proSubscriptions = await Subscription.count({
      where: {
        plan: SubscriptionPlan.PRO,
        status: 'active'
      }
    });
    
    console.log('👥 用户和订阅状态:');
    console.log(`   - 总用户数: ${totalUsers}`);
    console.log(`   - 专业版用户: ${proSubscriptions}`);
    console.log(`   - 专业版比例: ${totalUsers > 0 ? Math.round((proSubscriptions / totalUsers) * 100) : 0}%`);
    
    // 2. 检查反馈消息状态
    const totalFeedback = await FeedbackMessage.count();
    const wukongFeedback = await FeedbackMessage.count({
      where: {
        characterRank: CharacterRank.WUKONG
      }
    });
    const nonWukongFeedback = await FeedbackMessage.count({
      where: {
        characterRank: { [Op.ne]: CharacterRank.WUKONG }
      }
    });
    
    console.log('\n💬 反馈消息状态:');
    console.log(`   - 总反馈消息: ${totalFeedback}`);
    console.log(`   - 悟空反馈消息: ${wukongFeedback}`);
    console.log(`   - 非悟空反馈消息: ${nonWukongFeedback}`);
    
    // 按订阅计划统计反馈消息
    const trialFeedback = await FeedbackMessage.count({
      where: {
        subscriptionPlan: SubscriptionPlan.TRIAL
      }
    });
    const standardFeedback = await FeedbackMessage.count({
      where: {
        subscriptionPlan: SubscriptionPlan.STANDARD
      }
    });
    const proFeedback = await FeedbackMessage.count({
      where: {
        subscriptionPlan: SubscriptionPlan.PRO
      }
    });
    
    console.log(`   - 试用版反馈: ${trialFeedback}`);
    console.log(`   - 标准版反馈: ${standardFeedback}`);
    console.log(`   - 专业版反馈: ${proFeedback}`);
    
    // 3. 检查角色配置状态
    const totalCharacterConfig = await CharacterConfig.count();
    const wukongConfig = await CharacterConfig.count({
      where: {
        rank: CharacterRank.WUKONG
      }
    });
    const nonWukongConfig = await CharacterConfig.count({
      where: {
        rank: { [Op.ne]: CharacterRank.WUKONG }
      }
    });
    
    console.log('\n🎭 角色配置状态:');
    console.log(`   - 总角色配置: ${totalCharacterConfig}`);
    console.log(`   - 悟空角色配置: ${wukongConfig}`);
    console.log(`   - 非悟空角色配置: ${nonWukongConfig}`);
    
    // 4. 验证结果
    console.log('\n📊 验证结果:');
    const isCleanupComplete = nonWukongFeedback === 0 && nonWukongConfig === 0;
    const isAllUsersPro = totalUsers > 0 && proSubscriptions === totalUsers;
    const hasFeedbackData = totalFeedback > 0 && wukongFeedback > 0;
    
    console.log(`   - 非悟空数据清理: ${isCleanupComplete ? '✅ 完成' : '❌ 未完成'}`);
    console.log(`   - 所有用户专业版: ${isAllUsersPro ? '✅ 完成' : '❌ 未完成'}`);
    console.log(`   - 悟空反馈数据: ${hasFeedbackData ? '✅ 存在' : '❌ 缺失'}`);
    
    if (isCleanupComplete && isAllUsersPro && hasFeedbackData) {
      console.log('\n🎉 数据库状态验证通过！所有任务已完成。');
    } else {
      console.log('\n⚠️  数据库状态验证未通过，请检查上述问题。');
    }
    
  } catch (error) {
    console.error('❌ 验证数据库状态时出错:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await verifyDatabase();
  } catch (error) {
    console.error('❌ 数据库验证失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行验证脚本
if (require.main === module) {
  main();
}

export default main;