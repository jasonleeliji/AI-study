import { Sequelize, DataTypes, Model } from 'sequelize';

export class CharacterConfig extends Model {
  public id!: number;
  public role!: string;
  public rank?: string;
  public gamificationStage?: string;
  public subscriptionPlan!: string;
  public images?: object[];
  public isActive?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initCharacterConfigModel = (sequelize: Sequelize) => {
  CharacterConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rank: {
        type: DataTypes.STRING,
      },
      gamificationStage: {
        type: DataTypes.STRING,
      },
      subscriptionPlan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      images: {
        type: DataTypes.JSON,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'CharacterConfig',
      tableName: 'character_configs',
      indexes: [
        {
          unique: true,
          fields: ['role', 'rank', 'gamificationStage', 'subscriptionPlan'],
        },
      ],
    }
  );
};