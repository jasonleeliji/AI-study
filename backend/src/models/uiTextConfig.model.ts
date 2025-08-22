import { Sequelize, DataTypes, Model } from 'sequelize';

export interface IUITextConfig {
  id?: number;
  subscriptionPlan: string;
  feedbackTitle: string;
  sleepMessage: string;
  idleMessage: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UITextConfig extends Model {
  public id!: number;
  public subscriptionPlan!: string;
  public feedbackTitle!: string;
  public sleepMessage!: string;
  public idleMessage!: string;
  public isActive?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initUITextConfigModel = (sequelize: Sequelize) => {
  UITextConfig.init(
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
      feedbackTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sleepMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      idleMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'UITextConfig',
      tableName: 'uitextconfigs',
      timestamps: true,
    }
  );
};

export default UITextConfig;