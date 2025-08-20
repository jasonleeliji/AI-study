import { Sequelize, DataTypes, Model } from 'sequelize';

export class TokenUsage extends Model {
  public id!: number;
  public userId!: number;
  public inputTokens!: number;
  public outputTokens!: number;
  public totalTokens!: number;
  public analysisCount?: number;
  public sessionId?: number;
  public isFocused?: boolean;

  public readonly createdAt!: Date;
}

export const initTokenUsageModel = (sequelize: Sequelize) => {
  TokenUsage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      inputTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      outputTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      analysisCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      sessionId: {
        type: DataTypes.INTEGER,
      },
      isFocused: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'TokenUsage',
      tableName: 'token_usages',
      updatedAt: false,
    }
  );
};