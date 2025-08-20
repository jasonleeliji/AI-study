import { Sequelize, DataTypes, Model } from 'sequelize';
import { CharacterRank } from '../types/character';

export interface Break {
  startTime: Date;
  endTime?: Date;
  type: string;
}

export class StudySession extends Model {
  public id!: number;
  public userId!: number;
  public startTime!: Date;
  public endTime?: Date;
  public status!: string;
  public activeBreakType?: string;
  public focusHistory?: object[];
  public breakHistory?: Break[];
  public lastActivity?: Date;
  public currentRank?: CharacterRank;
  public consecutiveDistractions?: number;
  public lastFocusTime?: Date;
  public lastPositiveFeedbackTime?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initStudySessionModel = (sequelize: Sequelize) => {
  StudySession.init(
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
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'STUDYING',
      },
      activeBreakType: {
        type: DataTypes.STRING,
      },
      focusHistory: {
        type: DataTypes.JSON,
      },
      breakHistory: {
        type: DataTypes.JSON,
      },
      lastActivity: {
        type: DataTypes.DATE,
      },
      currentRank: {
        type: DataTypes.STRING,
        defaultValue: 'WUKONG',
      },
      consecutiveDistractions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastFocusTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      lastPositiveFeedbackTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'StudySession',
      tableName: 'study_sessions',
    }
  );
};