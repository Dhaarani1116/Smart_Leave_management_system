module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'staff', 'hod', 'principal'),
      allowNull: false,
    },
    department: {
      type: DataTypes.ENUM('CSE', 'CSE (AIML)', 'AI & DS', 'ECE', 'EEE', 'IT', 'MECH', 'CCE', 'CSBS', 'CSE (CYBER)'),
      allowNull: true,
    },
    class: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_on_leave: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    substitute_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    substitute_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  return User;
};
