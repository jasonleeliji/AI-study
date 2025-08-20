
import { Sequelize } from 'sequelize';
import { initUserModel } from '../models/user.model';
import { initChildProfileModel } from '../models/childProfile.model';
import { initStudySessionModel } from '../models/studySession.model';
import { initSubscriptionModel } from '../models/subscription.model';
import { initTokenUsageModel } from '../models/tokenUsage.model';
import { initAppConfigModel } from '../models/appConfig.model';
import { initAiPromptConfigModel } from '../models/aiPromptConfig.model';
import { initCharacterConfigModel } from '../models/characterConfig.model';
import { initFeedbackMessageModel } from '../models/feedbackMessage.model';
import { initFeedbackModel } from '../models/feedback.model';
import { initializeAssociations } from '../models';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
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
