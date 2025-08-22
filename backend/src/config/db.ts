
import { Sequelize } from 'sequelize';
import { initUserModel } from '../models/user.model';
import { initChildProfileModel } from '../models/childProfile.model';
import { initStudySessionModel } from '../models/studySession.model';
import { initSubscriptionModel } from '../models/subscription.model';
import { initTokenUsageModel } from '../models/tokenUsage.model';
import { initAppConfigModel } from '../models/appConfig.model';
import { initAiPromptConfigModel } from '../models/aiPromptConfig.model';
import { initUITextConfigModel } from '../models/uiTextConfig.model';
import { initCharacterConfigModel } from '../models/characterConfig.model';
import { initFeedbackMessageModel } from '../models/feedbackMessage.model';
import { initFeedbackModel } from '../models/feedback.model';
import { initializeAssociations } from '../models';
import config from './index';
import * as fs from 'fs';
import * as path from 'path';

// 获取数据库路径，支持云原生部署
const getDatabasePath = (): string => {
  // 如果设置了云原生数据库路径环境变量，优先使用
  if (process.env.CLOUD_NATIVE_DB_PATH) {
    const cloudPath = process.env.CLOUD_NATIVE_DB_PATH;
    // 确保云原生路径的目录存在
    const dir = path.dirname(cloudPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created database directory: ${dir}`);
    }
    return cloudPath;
  }
  
  // 如果设置了自定义数据库路径，使用自定义路径
  if (process.env.DATABASE_PATH) {
    const customPath = process.env.DATABASE_PATH;
    const dir = path.dirname(customPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created database directory: ${dir}`);
    }
    return customPath;
  }
  
  // 默认使用本地路径
  return config.database.path;
};

const databasePath = getDatabasePath();
console.log(`Using database path: ${databasePath}`);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite Connected...');
    
    // Initialize models
    initUserModel(sequelize);
    initChildProfileModel(sequelize);
    initStudySessionModel(sequelize);
    initSubscriptionModel(sequelize);
    initTokenUsageModel(sequelize);
    initAppConfigModel(sequelize);
    initAiPromptConfigModel(sequelize);
    initUITextConfigModel(sequelize);
    initCharacterConfigModel(sequelize);
    initFeedbackMessageModel(sequelize);
    initFeedbackModel(sequelize);

    // Initialize associations
    initializeAssociations();

    // Sync all models - use force: false to avoid recreating tables
    // and alter: false to prevent backup table creation issues
    await sequelize.sync({ force: false, alter: false });
    console.log("All models were synchronized successfully.");

  } catch (err: any) {
    console.error('Unable to connect to the database:', err);
    (process as any).exit(1);
  }
};

export { sequelize, connectDB };
