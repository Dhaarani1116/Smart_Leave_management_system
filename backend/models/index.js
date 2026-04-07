const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

const User = require('./User')(sequelize, Sequelize);
const Leave = require('./Leave')(sequelize, Sequelize);
const LeaveHistory = require('./LeaveHistory')(sequelize, Sequelize);
const Notification = require('./Notification')(sequelize, Sequelize);

// User Associations
User.hasMany(Leave, { foreignKey: 'requesterId', as: 'leaves' });
User.hasMany(Leave, { foreignKey: 'tempApproverId', as: 'tempApprovingFor' });

// Leave Associations
Leave.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Leave.belongsTo(User, { foreignKey: 'currentApproverId', as: 'currentApprover' });
Leave.belongsTo(User, { foreignKey: 'tempApproverId', as: 'tempApprover' });
Leave.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });
Leave.belongsTo(User, { foreignKey: 'hodId', as: 'hod' });
Leave.belongsTo(User, { foreignKey: 'finalApproverId', as: 'finalApprover' });
Leave.belongsTo(User, { foreignKey: 'rejectedById', as: 'rejectedBy' });

// Leave History Associations
Leave.hasMany(LeaveHistory, { foreignKey: 'leaveId', as: 'history' });
LeaveHistory.belongsTo(Leave, { foreignKey: 'leaveId' });
LeaveHistory.belongsTo(User, { foreignKey: 'actionBy', as: 'actionUser' });

// Notification Associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });
Notification.belongsTo(Leave, { foreignKey: 'leaveId', as: 'leave' });

module.exports = {
  sequelize,
  User,
  Leave,
  LeaveHistory,
  Notification,
};
