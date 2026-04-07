const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

dotenv.config();

const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');
const notificationRoutes = require('./routes/notifications');
const noticeRoutes = require('./routes/notices');

const app = express();

// CORS configuration - Allow Vercel frontend domains
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        /^https:\/\/.*\.vercel\.app$/,  // Allow all Vercel subdomains
        'https://*.vercel.app',
        'http://localhost:5173'
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LeaveFlow API Server is running!',
    status: 'active',
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notices', noticeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('🌱 Database empty, seeding with demo data...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create Principal
      await User.create({
        name: 'Dr. James Anderson',
        email: 'principal@college.edu',
        password: hashedPassword,
        role: 'principal'
      });

      // Create HOD
      await User.create({
        name: 'Dr. Sarah Wilson',
        email: 'hod.cse@college.edu',
        password: hashedPassword,
        role: 'hod',
        department: 'CSE'
      });

      // Create Staff
      await User.create({
        name: 'Prof. John Smith',
        email: 'staff.cse1@college.edu',
        password: hashedPassword,
        role: 'staff',
        department: 'CSE'
      });

      // Create Students
      await User.create({
        name: 'Student CSE 1',
        email: 'student.cse1@college.edu',
        password: hashedPassword,
        role: 'student',
        department: 'CSE',
        class: '2nd Year'
      });

      console.log('✅ Demo users created:');
      console.log('   Principal: principal@college.edu');
      console.log('   HOD: hod.cse@college.edu');
      console.log('   Staff: staff.cse1@college.edu');
      console.log('   Student: student.cse1@college.edu');
      console.log('   (All use password: password123)');
    } else {
      console.log(`✅ Database already has ${userCount} users`);
    }
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

sequelize.sync({ force: false }).then(() => {
  console.log('Database synced');
  seedDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
});
