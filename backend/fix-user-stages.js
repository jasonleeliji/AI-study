// 修复用户stage问题的脚本
// 根据用户实际灵力值重新设置正确的游戏化阶段
// 使用方法: node fix-user-stages.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env' });

// 导入模型
const ChildProfile = require('./dist/models/childProfile.model').default;
const AppConfig = require('./dist/models/appConfig.model').default;

// MongoDB连接
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const fixUserStages = async () => {
    try {
        await connectDB();
        
        console.log('\n=== 开始修复用户stage问题 ===');
        
        // 获取应用配置中的stage目标
        const appConfig = await AppConfig.getSingleton();
        console.log('\n✅ Stage目标配置:');
        console.log(`  - 石猴阶段目标: ${appConfig.stoneMonkeyGoalTokens.toLocaleString()} tokens`);
        console.log(`  - 洞主阶段目标: ${appConfig.caveMasterGoalTokens.toLocaleString()} tokens`);
        console.log(`  - 猴王阶段目标: ${appConfig.monkeyKingGoalTokens.toLocaleString()} tokens`);
        console.log(`  - 总猴王阶段目标: ${appConfig.totalMonkeyKingGoalTokens.toLocaleString()} tokens`);
        
        // 获取所有用户档案
        const profiles = await ChildProfile.find({});
        console.log(`\n找到 ${profiles.length} 个用户档案`);
        
        let fixedCount = 0;
        let alreadyCorrectCount = 0;
        
        for (const profile of profiles) {
            const currentPower = profile.totalSpiritualPower || 0;
            const currentStage = profile.gamificationStage;
            
            // 根据灵力值确定正确的stage
            let correctStage = 'STONE_MONKEY';
            if (currentPower >= appConfig.totalMonkeyKingGoalTokens) {
                correctStage = 'TOTAL_MONKEY_KING';
            } else if (currentPower >= appConfig.monkeyKingGoalTokens) {
                correctStage = 'MONKEY_KING';
            } else if (currentPower >= appConfig.caveMasterGoalTokens) {
                correctStage = 'CAVE_MASTER';
            }
            
            console.log(`\n用户 ${profile.user}:`);
            console.log(`  - 当前stage: ${currentStage}`);
            console.log(`  - 灵力值: ${currentPower.toLocaleString()}`);
            console.log(`  - 正确stage: ${correctStage}`);
            
            if (currentStage !== correctStage) {
                // 需要修复
                profile.gamificationStage = correctStage;
                await profile.save();
                console.log(`  ✅ 已修复: ${currentStage} -> ${correctStage}`);
                fixedCount++;
            } else {
                console.log(`  ✅ 已正确`);
                alreadyCorrectCount++;
            }
        }
        
        console.log('\n=== 修复完成 ===');
        console.log(`总用户数: ${profiles.length}`);
        console.log(`已修复: ${fixedCount}`);
        console.log(`本来就正确: ${alreadyCorrectCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error fixing user stages:', error);
        process.exit(1);
    }
};

fixUserStages();