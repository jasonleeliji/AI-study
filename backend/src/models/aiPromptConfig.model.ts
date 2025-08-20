import { Sequelize, DataTypes, Model } from 'sequelize';

export interface IAiPromptConfig {
  id?: number;
  subscriptionPlan: string;
  promptTemplate: string;
  analysisIntervalSeconds?: number;
  maxTokens?: number;
  analysisCategories?: object;
  distractedSubtypes?: object;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AiPromptConfig extends Model {
  public id!: number;
  public subscriptionPlan!: string;
  public promptTemplate!: string;
  public analysisIntervalSeconds?: number;
  public maxTokens?: number;
  public analysisCategories?: object;
  public distractedSubtypes?: object;
  public isActive?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAiPromptConfigModel = (sequelize: Sequelize) => {
  AiPromptConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subscriptionPlan: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      promptTemplate: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      analysisIntervalSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 150,
      },
      analysisCategories: {
        type: DataTypes.JSON,
      },
      distractedSubtypes: {
        type: DataTypes.JSON,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'AiPromptConfig',
      tableName: 'ai_prompt_configs',
    }
  );
};

export default AiPromptConfig;