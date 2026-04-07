const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const DEPARTMENTS = [
  'CSE',
  'CSE (AIML)',
  'AI & DS',
  'ECE',
  'EEE',
  'IT',
  'MECH',
  'CCE',
  'CSBS',
  'CSE (CYBER)'
];

const seedDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Dhaar1116*',
    });

    console.log('✅ Connected to MySQL server');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'leave_management'}`);
    console.log('✅ Database created');

    await connection.query(`USE ${process.env.DB_NAME || 'leave_management'}`);

    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Drop existing tables first (in correct order due to foreign keys)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS notifications');
    await connection.query('DROP TABLE IF EXISTS leave_history');
    await connection.query('DROP TABLE IF EXISTS leaves');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create updated users table with new schema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'staff', 'hod', 'principal') NOT NULL,
        department ENUM('CSE', 'CSE (AIML)', 'AI & DS', 'ECE', 'EEE', 'IT', 'MECH', 'CCE', 'CSBS', 'CSE (CYBER)'),
        class VARCHAR(255),
        is_on_leave BOOLEAN DEFAULT FALSE,
        substitute_id INT,
        substitute_expiry DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (substitute_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create updated leaves table with new schema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INT PRIMARY KEY AUTO_INCREMENT,
        requesterId INT NOT NULL,
        requesterRole ENUM('student', 'staff', 'hod', 'principal') NOT NULL,
        requesterName VARCHAR(255) NOT NULL,
        requesterDepartment VARCHAR(255) NOT NULL,
        requesterYear VARCHAR(50),
        fromDate DATE NOT NULL,
        toDate DATE NOT NULL,
        reason TEXT NOT NULL,
        leaveType ENUM('medical', 'personal', 'academic', 'other') NOT NULL,
        status ENUM('Pending', 'In_Progress', 'Approved', 'Rejected', 'Auto_Approved') DEFAULT 'Pending',
        currentApproverId INT,
        currentApproverRole ENUM('staff', 'hod', 'principal', 'system'),
        isTempApprover BOOLEAN DEFAULT FALSE,
        tempApproverId INT,
        approvalChain JSON,
        staffId INT,
        hodId INT,
        finalApproverId INT,
        finalApprovedAt DATETIME,
        rejectedById INT,
        rejectedAt DATETIME,
        rejectionReason TEXT,
        comments JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (currentApproverId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (tempApproverId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (staffId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (hodId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (finalApproverId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (rejectedById) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        leaveId INT NOT NULL,
        actionBy INT NOT NULL,
        role ENUM('student', 'staff', 'hod', 'principal') NOT NULL,
        action ENUM('applied', 'forwarded_to_staff', 'forwarded_to_hod', 'forwarded_to_principal', 'approved', 'rejected', 'auto_approved') NOT NULL,
        comment TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (leaveId) REFERENCES leaves(id) ON DELETE CASCADE,
        FOREIGN KEY (actionBy) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning') DEFAULT 'info',
        isRead BOOLEAN DEFAULT FALSE,
        leaveId INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (leaveId) REFERENCES leaves(id) ON DELETE SET NULL
      )
    `);

    console.log('📝 Creating comprehensive enterprise test data...\n');

    // Create users for each department
    const users = [];
    let userId = 1;

    // Principal (no department)
    users.push({
      id: userId++,
      name: 'Dr. James Anderson',
      email: 'principal@college.edu',
      role: 'principal',
      department: null,
      class: null,
      is_on_leave: false
    });

    // Create HODs for each department
    const hodNames = [
      { name: 'Dr. Sarah Wilson', dept: 'CSE' },
      { name: 'Dr. Michael Chen', dept: 'CSE (AIML)' },
      { name: 'Dr. Emily Davis', dept: 'AI & DS' },
      { name: 'Dr. Robert Brown', dept: 'ECE' },
      { name: 'Dr. Lisa Johnson', dept: 'EEE' },
      { name: 'Dr. David Lee', dept: 'IT' },
      { name: 'Dr. Jennifer White', dept: 'MECH' },
      { name: 'Dr. Kevin Park', dept: 'CCE' },
      { name: 'Dr. Maria Garcia', dept: 'CSBS' },
      { name: 'Dr. Alex Turner', dept: 'CSE (CYBER)' }
    ];

    hodNames.forEach((hod, index) => {
      users.push({
        id: userId++,
        name: hod.name,
        email: `hod.${hod.dept.toLowerCase().replace(/[()&\s]/g, '')}@college.edu`,
        role: 'hod',
        department: hod.dept,
        class: null,
        is_on_leave: false
      });
    });

    // Create Staff for each department (2 per department)
    const staffNames = [
      { name: 'Prof. John Smith', dept: 'CSE' },
      { name: 'Prof. Alice Johnson', dept: 'CSE' },
      { name: 'Prof. Bob Williams', dept: 'CSE (AIML)' },
      { name: 'Prof. Carol Martinez', dept: 'CSE (AIML)' },
      { name: 'Prof. Charlie Brown', dept: 'AI & DS' },
      { name: 'Prof. Diana Prince', dept: 'AI & DS' },
      { name: 'Prof. Edward Norton', dept: 'ECE' },
      { name: 'Prof. Fiona Apple', dept: 'ECE' },
      { name: 'Prof. George Martin', dept: 'EEE' },
      { name: 'Prof. Hannah Montana', dept: 'EEE' },
      { name: 'Prof. Ian McKellen', dept: 'IT' },
      { name: 'Prof. Julia Roberts', dept: 'IT' },
      { name: 'Prof. Kyle Reese', dept: 'MECH' },
      { name: 'Prof. Laura Croft', dept: 'MECH' },
      { name: 'Prof. Mike Ross', dept: 'CCE' },
      { name: 'Prof. Nancy Drew', dept: 'CCE' },
      { name: 'Prof. Oscar Wilde', dept: 'CSBS' },
      { name: 'Prof. Penny Wise', dept: 'CSBS' },
      { name: 'Prof. Quinn Fabray', dept: 'CSE (CYBER)' },
      { name: 'Prof. Rachel Green', dept: 'CSE (CYBER)' }
    ];

    staffNames.forEach((staff, index) => {
      users.push({
        id: userId++,
        name: staff.name,
        email: `staff.${staff.dept.toLowerCase().replace(/[()&\s]/g, '')}${index % 2 + 1}@college.edu`,
        role: 'staff',
        department: staff.dept,
        class: null,
        is_on_leave: index === 2,
        substitute_id: index === 2 ? 12 : null,
        substitute_expiry: index === 2 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : null
      });
    });

    // Create Students for each department (5 per department)
    const classes = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    DEPARTMENTS.forEach((dept, deptIndex) => {
      for (let i = 1; i <= 5; i++) {
        users.push({
          id: userId++,
          name: `Student ${dept} ${i}`,
          email: `student.${dept.toLowerCase().replace(/[()&\s]/g, '')}${i}@college.edu`,
          role: 'student',
          department: dept,
          class: classes[Math.floor(Math.random() * classes.length)],
          is_on_leave: false
        });
      }
    });

    // Insert users
    for (const user of users) {
      await connection.query(
        `INSERT INTO users (id, name, email, password, role, department, class, is_on_leave, substitute_id, substitute_expiry, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email, hashedPassword, user.role, user.department, user.class, user.is_on_leave || false, user.substitute_id || null, user.substitute_expiry || null, now, now]
      );
    }
    console.log(`✅ Created ${users.length} users across all departments`);

    // Create sample leave requests with realistic workflow
    const leaves = [];
    const leaveId = 1;

    // Students from CSE department requesting leave
    const cseStudents = users.filter(u => u.role === 'student' && u.department === 'CSE');
    const cseHod = users.find(u => u.role === 'hod' && u.department === 'CSE');
    const cseStaff = users.filter(u => u.role === 'staff' && u.department === 'CSE');

    // Leave 1: Approved through full workflow
    leaves.push({
      id: 1,
      requesterId: cseStudents[0].id,
      requesterRole: 'student',
      fromDate: '2024-04-10',
      toDate: '2024-04-12',
      reason: 'Medical appointment - dental surgery',
      leaveType: 'medical',
      status: 'Approved',
      currentApproverId: null,
      currentApproverRole: null,
      staffId: cseStaff[0].id,
      hodId: cseHod.id,
      finalApproverId: 1,
      finalApprovedAt: now,
      approvalChain: JSON.stringify(['staff', 'hod', 'principal'])
    });

    // Leave 2: Pending at Staff level
    leaves.push({
      id: 2,
      requesterId: cseStudents[1].id,
      requesterRole: 'student',
      fromDate: '2024-04-20',
      toDate: '2024-04-22',
      reason: 'Family function - sister wedding',
      leaveType: 'personal',
      status: 'Pending',
      currentApproverId: cseStaff[0].id,
      currentApproverRole: 'staff',
      staffId: cseStaff[0].id,
      hodId: cseHod.id,
      approvalChain: JSON.stringify(['staff', 'hod', 'principal'])
    });

    // Leave 3: In Progress at HOD level
    leaves.push({
      id: 3,
      requesterId: cseStudents[2].id,
      requesterRole: 'student',
      fromDate: '2024-04-15',
      toDate: '2024-04-16',
      reason: 'Academic conference attendance',
      leaveType: 'academic',
      status: 'In_Progress',
      currentApproverId: cseHod.id,
      currentApproverRole: 'hod',
      staffId: cseStaff[0].id,
      hodId: cseHod.id,
      approvalChain: JSON.stringify(['staff', 'hod', 'principal'])
    });

    // Leave 4: Rejected by Staff
    leaves.push({
      id: 4,
      requesterId: cseStudents[3].id,
      requesterRole: 'student',
      fromDate: '2024-04-25',
      toDate: '2024-04-26',
      reason: 'Personal work at hometown',
      leaveType: 'personal',
      status: 'Rejected',
      currentApproverId: null,
      currentApproverRole: null,
      staffId: cseStaff[0].id,
      hodId: cseHod.id,
      rejectedById: cseStaff[0].id,
      rejectedAt: now,
      rejectionReason: 'Insufficient notice period',
      approvalChain: JSON.stringify(['staff', 'hod', 'principal'])
    });

    // Leave 5: Auto-approved (Principal leave)
    leaves.push({
      id: 5,
      requesterId: 1,
      requesterRole: 'principal',
      fromDate: '2024-05-01',
      toDate: '2024-05-03',
      reason: 'Administrative work',
      leaveType: 'other',
      status: 'Auto_Approved',
      currentApproverId: null,
      currentApproverRole: 'system',
      finalApproverId: 1,
      finalApprovedAt: now,
      approvalChain: JSON.stringify(['system'])
    });

    // Leave 6: Staff leave (Staff → HOD → Principal)
    const cseStaffMember = cseStaff[0];
    leaves.push({
      id: 6,
      requesterId: cseStaffMember.id,
      requesterRole: 'staff',
      fromDate: '2024-04-18',
      toDate: '2024-04-19',
      reason: 'Professional development workshop',
      leaveType: 'academic',
      status: 'In_Progress',
      currentApproverId: cseHod.id,
      currentApproverRole: 'hod',
      hodId: cseHod.id,
      approvalChain: JSON.stringify(['hod', 'principal'])
    });

    // Leave 7: Using substitute approver
    const onLeaveStaff = users.find(u => u.is_on_leave && u.role === 'staff');
    if (onLeaveStaff) {
      leaves.push({
        id: 7,
        requesterId: cseStudents[4].id,
        requesterRole: 'student',
        fromDate: '2024-04-28',
        toDate: '2024-04-30',
        reason: 'Medical emergency - hospitalization',
        leaveType: 'medical',
        status: 'Pending',
        currentApproverId: onLeaveStaff.substitute_id,
        currentApproverRole: 'staff',
        isTempApprover: true,
        tempApproverId: onLeaveStaff.substitute_id,
        staffId: onLeaveStaff.id,
        hodId: cseHod.id,
        approvalChain: JSON.stringify(['staff', 'hod', 'principal'])
      });
    }

    // Insert leaves
    for (const leave of leaves) {
      await connection.query(
        `INSERT INTO leaves (id, requesterId, requesterRole, requesterName, requesterDepartment, requesterYear, fromDate, toDate, reason, leaveType, status, 
         currentApproverId, currentApproverRole, isTempApprover, tempApproverId, approvalChain, 
         staffId, hodId, finalApproverId, finalApprovedAt, rejectedById, rejectedAt, rejectionReason, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          leave.id, leave.requesterId, leave.requesterRole, leave.requesterName || 'Unknown', leave.requesterDepartment || 'CSE', leave.requesterYear || null,
          leave.fromDate, leave.toDate, 
          leave.reason, leave.leaveType, leave.status, leave.currentApproverId || null, 
          leave.currentApproverRole || null, leave.isTempApprover || false, leave.tempApproverId || null,
          leave.approvalChain, leave.staffId || null, leave.hodId || null, leave.finalApproverId || null,
          leave.finalApprovedAt || null, leave.rejectedById || null, leave.rejectedAt || null,
          leave.rejectionReason || null, now, now
        ]
      );
    }
    console.log(`✅ Created ${leaves.length} sample leave requests with realistic workflow`);

    // Create leave history
    const histories = [
      { leaveId: 1, actionBy: cseStudents[0].id, role: 'student', action: 'applied', comment: 'Submitted medical certificate' },
      { leaveId: 1, actionBy: cseStaff[0].id, role: 'staff', action: 'forwarded_to_hod', comment: 'Verified medical documents' },
      { leaveId: 1, actionBy: cseHod.id, role: 'hod', action: 'forwarded_to_principal', comment: 'Approved, forwarded for final approval' },
      { leaveId: 1, actionBy: 1, role: 'principal', action: 'approved', comment: 'Final approval granted' },
      { leaveId: 2, actionBy: cseStudents[1].id, role: 'student', action: 'applied', comment: 'Attached wedding invitation' },
      { leaveId: 3, actionBy: cseStudents[2].id, role: 'student', action: 'applied', comment: 'Conference registration proof attached' },
      { leaveId: 3, actionBy: cseStaff[0].id, role: 'staff', action: 'forwarded_to_hod', comment: 'Verified academic purpose' },
      { leaveId: 4, actionBy: cseStudents[3].id, role: 'student', action: 'applied', comment: 'Personal reasons' },
      { leaveId: 4, actionBy: cseStaff[0].id, role: 'staff', action: 'rejected', comment: 'Insufficient notice period' },
      { leaveId: 5, actionBy: 1, role: 'principal', action: 'auto_approved', comment: 'Auto-approved as Principal' },
      { leaveId: 6, actionBy: cseStaffMember.id, role: 'staff', action: 'applied', comment: 'Workshop registration attached' },
    ];

    for (const history of histories) {
      await connection.query(
        'INSERT INTO leave_history (leaveId, actionBy, role, action, comment, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [history.leaveId, history.actionBy, history.role, history.action, history.comment, now, now]
      );
    }
    console.log(`✅ Created ${histories.length} history records`);

    // Create notifications
    const notifications = [
      { userId: cseStudents[0].id, message: 'Your leave request from Apr 10-12 has been fully approved', type: 'success', leaveId: 1, isRead: true },
      { userId: cseStudents[1].id, message: 'Your leave request from Apr 20-22 is pending staff approval', type: 'info', leaveId: 2 },
      { userId: cseStaff[0].id, message: 'New leave request from Student CSE 2 requires your review', type: 'warning', leaveId: 2 },
      { userId: cseHod.id, message: 'Leave request from Student CSE 3 forwarded for HOD approval', type: 'info', leaveId: 3 },
      { userId: cseStudents[3].id, message: 'Your leave request has been rejected by staff', type: 'warning', leaveId: 4 },
      { userId: 1, message: 'Your leave has been auto-approved', type: 'success', leaveId: 5 },
      { userId: cseHod.id, message: 'Staff leave request forwarded for HOD approval', type: 'info', leaveId: 6 },
    ];

    for (const notif of notifications) {
      await connection.query(
        'INSERT INTO notifications (userId, message, type, isRead, leaveId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [notif.userId, notif.message, notif.type, notif.isRead || false, notif.leaveId || null, now, now]
      );
    }
    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('\n🎉 Enterprise Database seeded successfully!\n');
    console.log('📧 Demo Accounts (all use password: password123):');
    console.log('\n👤 Principal:');
    console.log('   principal@college.edu');
    console.log('\n👤 HODs (by Department):');
    hodNames.forEach(hod => {
      console.log(`   ${hod.dept}: hod.${hod.dept.toLowerCase().replace(/[()&\s]/g, '')}@college.edu`);
    });
    console.log('\n👤 Staff (Sample - CSE):');
    console.log('   staff.cse1@college.edu (Class Advisor)');
    console.log('   staff.cse2@college.edu');
    console.log('   (One staff member is on leave with temp approver assigned)');
    console.log('\n👤 Students (Sample - CSE):');
    console.log('   student.cse1@college.edu through student.cse5@college.edu');
    console.log('\n🏢 Departments Available:');
    DEPARTMENTS.forEach(dept => console.log(`   • ${dept}`));
    console.log('\n✨ Features Available:');
    console.log('   • Dynamic Approval Hierarchy');
    console.log('   • Temporary Approver System');
    console.log('   • Department-based Analytics');
    console.log('   • Conflict Detection');
    console.log('   • Role-based Dashboards');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
