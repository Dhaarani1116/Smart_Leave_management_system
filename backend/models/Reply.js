module.exports = (sequelize, DataTypes) => {
  const Reply = sequelize.define('Reply', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    noticeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notices',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    userRole: {
      type: DataTypes.ENUM('principal', 'hod', 'staff', 'student'),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'replies',
    timestamps: true,
  });

  return Reply;
};
