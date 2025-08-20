import { Sequelize, DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';

export class User extends Model {
  public id!: number;
  public phone!: string;
  public password!: string;
  public trialEndDate?: Date;
  public subscriptionId?: number;
  public childProfileId?: number;
  public totalTokensUsed?: number;
  public dailyRemainingSeconds?: number;
  public lastResetDate?: Date;
  public isParentVerified?: boolean;

  // Associations
  public subscription?: any;
  public childProfile?: any;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to check password
  public async matchPassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      trialEndDate: {
        type: DataTypes.DATE,
      },
      subscriptionId: {
        type: DataTypes.INTEGER,
      },
      childProfileId: {
        type: DataTypes.INTEGER,
      },
      totalTokensUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dailyRemainingSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastResetDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      isParentVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );
};