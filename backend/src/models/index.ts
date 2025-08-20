import { Sequelize } from 'sequelize';
import { User } from './user.model';
import { ChildProfile } from './childProfile.model';
import { StudySession } from './studySession.model';
import { Subscription } from './subscription.model';
import { TokenUsage } from './tokenUsage.model';
import { AppConfig } from './appConfig.model';
import { AiPromptConfig } from './aiPromptConfig.model';
import { CharacterConfig } from './characterConfig.model';
import { FeedbackMessage, IFeedbackMessage } from './feedbackMessage.model';
import { Feedback } from './feedback.model';

export const initializeAssociations = () => {
  // User associations
  User.hasOne(ChildProfile, {
    foreignKey: 'userId',
    as: 'childProfile',
  });
  User.hasOne(Subscription, {
    foreignKey: 'userId',
    as: 'subscription',
  });
  User.hasMany(StudySession, {
    foreignKey: 'userId',
    as: 'studySessions',
  });
  User.hasMany(TokenUsage, {
    foreignKey: 'userId',
    as: 'tokenUsages',
  });
  User.hasMany(Feedback, {
    foreignKey: 'userId',
    as: 'feedbacks',
  });

  // ChildProfile associations
  ChildProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // Subscription associations
  Subscription.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // StudySession associations
  StudySession.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
  StudySession.hasMany(TokenUsage, {
    foreignKey: 'sessionId',
    as: 'tokenUsages',
  });

  // TokenUsage associations
  TokenUsage.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
  TokenUsage.belongsTo(StudySession, {
    foreignKey: 'sessionId',
    as: 'session',
  });

  // Feedback associations
  Feedback.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
  Feedback.belongsTo(StudySession, {
    foreignKey: 'sessionId',
    as: 'session',
  });
};

export {
  User,
  ChildProfile,
  StudySession,
  Subscription,
  TokenUsage,
  AppConfig,
  AiPromptConfig,
  CharacterConfig,
  FeedbackMessage,
  IFeedbackMessage,
  Feedback,
};