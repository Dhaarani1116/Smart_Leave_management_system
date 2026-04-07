const bcrypt = require('bcryptjs');
const { sequelize, User, Leave, LeaveHistory, Notification } = require('./models');

const seedSQLiteDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Reset database
    console.log('✅ Database synced');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Principal
    const principal = await User.create({
      name: 'Dr. James Anderson',
      email: 'principal@college.edu',
      password: hashedPassword,
      role: 'principal',
      department: null
    });
    console.log('✅ Created Principal');

    // Create HODs
    const hodData = [
      { name: 'Dr. Sarah Wilson', dept: 'CSE', email: 'hod.cse@college.edu' },
      { name: 'Dr. Michael Chen', dept: 'CSE (AIML)', email: 'hod.cseaiml@college.edu' },
    ];

    const hods = [];
    for (const hod of hodData) {
      const createdHod = await User.create({
        name: hod.name,
        email: hod.email,
        password: hashedPassword,
        role: 'hod',
        department: hod.dept
      });
      hods.push(createdHod);
    }
    console.log(`✅ Created ${hods.length} HODs`);

    // Create Staff
    const staffData = [
      { name: 'Prof. John Smith', dept: 'CSE', email: 'staff.cse1@college.edu' },
      { name: 'Prof. Alice Johnson', dept: 'CSE', email: 'staff.cse2@college.edu' },
    ];

    const staffs = [];
    for (const staff of staffData) {
      const createdStaff = await User.create({
        name: staff.name,
        email: staff.email,
        password: hashedPassword,
        role: 'staff',
        department: staff.dept
      });
      staffs.push(createdStaff);
    }
    console.log(`✅ Created ${staffs.length} Staff`);

    // Create Students
    const students = [];
    for (let i = 1; i <= 3; i++) {
      const student = await User.create({
        name: `Student CSE ${i}`,
        email: `student.cse${i}@college.edu`,
        password: hashedPassword,
        role: 'student',
        department: 'CSE',
        class: '2nd Year'
      });
      students.push(student);
    }
    console.log(`✅ Created ${students.length} Students`);

    // Create sample leave
    const leave = await Leave.create({
      requesterId: students[0].id,
      requesterRole: 'student',
      requesterName: students[0].name,
      requesterDepartment: students[0].department,
      requesterYear: students[0].class,
      fromDate: '2024-04-10',
      toDate: '2024-04-12',
      reason: 'Medical appointment',
      leaveType: 'medical',
      status: 'Approved',
      staffId: staffs[0].id,
      hodId: hods[0].id,
      finalApproverId: principal.id,
      approvalChain: JSON.stringify(['staff', 'hod', 'principal'])
    });
    console.log('✅ Created sample leave request');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Demo Accounts (password: password123):');
    console.log('   Principal: principal@college.edu');
    console.log('   HOD: hod.cse@college.edu');
    console.log('   Staff: staff.cse1@college.edu');
    console.log('   Student: student.cse1@college.edu');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedSQLiteDatabase();
