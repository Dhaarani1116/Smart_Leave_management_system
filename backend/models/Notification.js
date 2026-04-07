module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning'),
      defaultValue: 'info',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    leaveId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
  });

  return Notification;
};
