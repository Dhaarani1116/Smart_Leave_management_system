# Student Leave Management System

A full-stack web application for managing student leave requests in educational institutions.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MySQL + Sequelize ORM
- **Authentication:** JWT

## Features

- 4-Level Approval Hierarchy: Student → Staff → HOD → Principal
- Visual Leave Status Timeline
- Smart Alerts & Warnings
- Interactive Calendar View
- Leave Conflict Detection
- Real-time Notifications
- Analytics Dashboard

## Project Structure

```
leave_management/
├── backend/           # Express.js backend
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Auth middleware
│   ├── models/        # Sequelize models
│   └── routes/        # API routes
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
└── database.sql       # SQL schema
```

## Setup Instructions

### 1. Database Setup

1. Install MySQL on your system
2. Open MySQL and run the schema:
```bash
mysql -u root -p < database.sql
```
3. Update `backend/.env` with your MySQL credentials

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default User Accounts

After running the database.sql, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Student | john@college.edu | password123 |
| Staff | sarah@college.edu | password123 |
| HOD | emily@college.edu | password123 |
| Principal | principal@college.edu | password123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Leaves
- `POST /api/leaves/apply` - Apply for leave (Student)
- `GET /api/leaves/my-leaves` - Get my leaves (Student)
- `GET /api/leaves/all` - Get all leaves (Staff/HOD/Principal)
- `GET /api/leaves/stats` - Get leave statistics (HOD/Principal)
- `GET /api/leaves/conflicts` - Get conflict detection
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave

### Notifications
- `GET /api/notifications/my` - Get my notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
