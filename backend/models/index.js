const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Use SQLite for production (Render) if no MySQL credentials provided
// Use MySQL for local development if credentials exist
const useSQLite = !process.env.DB_HOST || process.env.NODE_ENV === 'production';

let sequelize;

if (useSQLite) {
  // SQLite configuration - file based, no server needed
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false,
  });
  console.log('Using SQLite database');
} else {
  // MySQL configuration for local development
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );
  console.log('Using MySQL database');
}

const User = require('./User')(sequelize, Sequelize);
const Leave = require('./Leave')(sequelize, Sequelize);
const LeaveHistory = require('./LeaveHistory')(sequelize, Sequelize);
const Notification = require('./Notification')(sequelize, Sequelize);
const Notice = require('./Notice')(sequelize, Sequelize);
const Reply = require('./Reply')(sequelize, Sequelize);

// User Associations
User.hasMany(Leave, { foreignKey: 'requesterId', as: 'leaves' });
User.hasMany(Leave, { foreignKey: 'tempApproverId', as: 'tempApprovingFor' });
User.hasMany(Notice, { foreignKey: 'senderId', as: 'sentNotices' });
User.hasMany(Reply, { foreignKey: 'userId', as: 'replies' });

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

// Notice Associations
Notice.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Notice.hasMany(Reply, { foreignKey: 'noticeId', as: 'replies' });

// Reply Associations
Reply.belongsTo(Notice, { foreignKey: 'noticeId' });
Reply.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Leave,
  LeaveHistory,
  Notification,
  Notice,
  Reply,
};
