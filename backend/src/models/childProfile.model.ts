import { Sequelize, DataTypes, Model } from 'sequelize';

export class ChildProfile extends Model {
  public id!: number;
  public userId!: number;
  public nickname!: string;
  public age!: number;
  public grade!: string;
  public gender!: string;
  public minSessionDuration!: number;
  public stretchBreak!: number;
  public waterBreak!: number;
  public restroomBreak!: number;
  public forcedBreakDuration!: number;
  public workDurationBeforeForcedBreak!: number;
  public waterBreakLimit!: number;
  public restroomBreakLimit!: number;
  public gamificationStage?: string;
  public totalSpiritualPower?: number;
  public dailySpiritualPower?: number;
  public totalFocusSeconds?: number;
  public dailyFocusSeconds?: number;
  public lastFocusUpdate?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initChildProfileModel = (sequelize: Sequelize) => {
  ChildProfile.init(
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
      nickname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      grade: {
        type: DataTypes.ENUM('幼儿园', '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级'),
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      minSessionDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stretchBreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      waterBreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      restroomBreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      forcedBreakDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workDurationBeforeForcedBreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      waterBreakLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      restroomBreakLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gamificationStage: {
        type: DataTypes.STRING,
        defaultValue: 'STONE_MONKEY',
      },
      totalSpiritualPower: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dailySpiritualPower: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalFocusSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dailyFocusSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastFocusUpdate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ChildProfile',
      tableName: 'child_profiles',
    }
  );
};