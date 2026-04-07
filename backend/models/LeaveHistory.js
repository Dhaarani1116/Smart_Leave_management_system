module.exports = (sequelize, DataTypes) => {
  const LeaveHistory = sequelize.define('LeaveHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    leaveId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leaves',
        key: 'id',
      },
    },
    actionBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('student', 'staff', 'hod', 'principal'),
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('applied', 'forwarded_to_hod', 'forwarded_to_principal', 'approved', 'rejected'),
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'leave_history',
    timestamps: true,
  });

  return LeaveHistory;
};
