import { Sequelize, DataTypes, Model } from 'sequelize';

export class Feedback extends Model {
  public id!: number;
  public userId!: number;
  public sessionId?: number;
  public content!: string;
  public status?: string;

  public readonly createdAt!: Date;
}

export const initFeedbackModel = (sequelize: Sequelize) => {
  Feedback.init(
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
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      content: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'Feedback',
      tableName: 'feedbacks',
      updatedAt: false,
    }
  );
};