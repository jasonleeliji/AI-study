import { Sequelize, DataTypes, Model } from 'sequelize';

export class Subscription extends Model {
  public id!: number;
  public userId!: number;
  public plan!: string;
  public status!: string;
  public startDate!: Date;
  public endDate!: Date;
  public alipayTradeNo?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initSubscriptionModel = (sequelize: Sequelize) => {
  Subscription.init(
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
      plan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      alipayTradeNo: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'subscriptions',
    }
  );
};