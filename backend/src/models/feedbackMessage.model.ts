import { Sequelize, DataTypes, Model, Op } from 'sequelize';

export interface IFeedbackMessage {
  id?: number;
  characterRank: string;
  subscriptionPlan: string;
  studyState: string;
  distractedSubtype?: string;
  messages: string[];
  audioUrls?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FeedbackMessage extends Model {
  public id!: number;
  public characterRank!: string;
  public subscriptionPlan!: string;
  public studyState!: string;
  public distractedSubtype?: string;
  public messages!: string[];
  public audioUrls?: string[];
  public isActive?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initFeedbackMessageModel = (sequelize: Sequelize) => {
  FeedbackMessage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      characterRank: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subscriptionPlan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      studyState: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      distractedSubtype: {
        type: DataTypes.STRING,
      },
      messages: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      audioUrls: {
        type: DataTypes.JSON,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'FeedbackMessage',
      tableName: 'feedback_messages',
      indexes: [
        {
          unique: true,
          fields: ['characterRank', 'subscriptionPlan', 'studyState', 'distractedSubtype'],
        },
      ],
    }
  );
};

export default FeedbackMessage;