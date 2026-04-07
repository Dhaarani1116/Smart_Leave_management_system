module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define('Leave', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    requesterRole: {
      type: DataTypes.ENUM('student', 'staff', 'hod', 'principal'),
      allowNull: false,
    },
    requesterName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requesterDepartment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requesterYear: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fromDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    toDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    leaveType: {
      type: DataTypes.ENUM('medical', 'personal', 'academic', 'other'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'In_Progress', 'Approved', 'Rejected', 'Auto_Approved'),
      defaultValue: 'Pending',
    },
    currentApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    currentApproverRole: {
      type: DataTypes.ENUM('staff', 'hod', 'principal', 'system'),
      allowNull: true,
    },
    isTempApprover: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tempApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvalChain: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    finalApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    finalApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'leaves',
    timestamps: true,
  });

  return Leave;
};
