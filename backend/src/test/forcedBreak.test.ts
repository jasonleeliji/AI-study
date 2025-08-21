import { checkAndHandleForcedBreak, onStudySessionStart, onStudySessionEnd, onUserBreak, onUserResumeFromBreak } from '../services/forcedBreak.service';
import { StudySession } from '../models/studySession.model';
import { ChildProfile } from '../models/childProfile.model';
import { StudyStatus } from '../types/studySession';

// 这是一个简单的测试文件，用于验证强制休息功能
// 在实际环境中，您可以使用Jest或其他测试框架

/**
 * 测试强制休息功能的基本流程
 */
export const testForcedBreakFlow = async () => {
    console.log('开始测试强制休息功能...');
    
    try {
        // 模拟用户开始学习会话
        const testUserId = '123';
        console.log(`模拟用户 ${testUserId} 开始学习会话`);
        onStudySessionStart(testUserId);
        
        // 等待一段时间后检查强制休息
        console.log('等待并检查强制休息逻辑...');
        await checkAndHandleForcedBreak();
        
        // 模拟用户主动休息
        console.log(`模拟用户 ${testUserId} 主动休息`);
        onUserBreak(testUserId);
        
        // 模拟用户恢复学习
        console.log(`模拟用户 ${testUserId} 恢复学习`);
        onUserResumeFromBreak(testUserId);
        
        // 模拟用户结束学习会话
        console.log(`模拟用户 ${testUserId} 结束学习会话`);
        onStudySessionEnd(testUserId);
        
        console.log('强制休息功能测试完成');
    } catch (error) {
        console.error('测试过程中出现错误:', error);
    }
};

/**
 * 验证强制休息配置
 */
export const validateForcedBreakConfig = () => {
    console.log('验证强制休息配置...');
    
    // 检查默认配置
    const defaultWorkDuration = 60; // 60分钟
    const defaultBreakDuration = 10; // 10分钟
    
    console.log(`默认连续学习时长限制: ${defaultWorkDuration} 分钟`);
    console.log(`默认强制休息时长: ${defaultBreakDuration} 分钟`);
    
    // 这里可以添加更多的配置验证逻辑
    console.log('强制休息配置验证完成');
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
    validateForcedBreakConfig();
    // testForcedBreakFlow(); // 需要数据库连接才能运行
}