import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppConfig extends Model {
  public id!: number;
  public positiveFeedbackMinutes!: number;
  public standardPlanPrice!: number;
  public proPlanPrice!: number;
  public stoneMonkeyGoalTokens!: number;
  public caveMasterGoalTokens!: number;
  public monkeyKingGoalTokens!: number;
  public totalMonkeyKingGoalTokens!: number;
  public wechatQrImageUrl!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAppConfigModel = (sequelize: Sequelize) => {
  AppConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      positiveFeedbackMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      standardPlanPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      proPlanPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stoneMonkeyGoalTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      caveMasterGoalTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      monkeyKingGoalTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalMonkeyKingGoalTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      wechatQrImageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'AppConfig',
      tableName: 'app_configs',
    }
  );
};