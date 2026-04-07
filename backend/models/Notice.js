module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define('Notice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    senderRole: {
      type: DataTypes.ENUM('principal', 'hod', 'staff'),
      allowNull: false,
    },
    targetRole: {
      type: DataTypes.ENUM('all', 'hod', 'staff', 'student'),
      allowNull: false,
      defaultValue: 'all',
    },
    targetDepartment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
  }, {
    tableName: 'notices',
    timestamps: true,
  });

  return Notice;
};
