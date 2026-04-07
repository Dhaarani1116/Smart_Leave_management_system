-- Student Leave Management System - SQL Schema

CREATE DATABASE IF NOT EXISTS leave_management;
USE leave_management;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'staff', 'hod', 'principal') NOT NULL,
    department VARCHAR(255),
    class VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leaves Table
CREATE TABLE IF NOT EXISTS leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    studentId INT NOT NULL,
    fromDate DATE NOT NULL,
    toDate DATE NOT NULL,
    reason TEXT NOT NULL,
    leaveType ENUM('medical', 'personal', 'academic', 'other') NOT NULL,
    status ENUM('Pending_Staff', 'Pending_HOD', 'Pending_Principal', 'Approved', 'Rejected') DEFAULT 'Pending_Staff',
    staffApproved BOOLEAN DEFAULT FALSE,
    hodApproved BOOLEAN DEFAULT FALSE,
    principalApproved BOOLEAN DEFAULT FALSE,
    staffComment TEXT,
    hodComment TEXT,
    principalComment TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- Leave History Table
CREATE TABLE IF NOT EXISTS leave_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    leaveId INT NOT NULL,
    actionBy INT NOT NULL,
    role ENUM('student', 'staff', 'hod', 'principal') NOT NULL,
    action ENUM('applied', 'forwarded_to_hod', 'forwarded_to_principal', 'approved', 'rejected') NOT NULL,
    comment TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leaveId) REFERENCES leaves(id) ON DELETE CASCADE,
    FOREIGN KEY (actionBy) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
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
);

-- Sample Data Insertion (Optional)

-- Insert sample users (passwords are hashed with bcrypt - 'password123')
-- Note: In production, use proper password hashing

-- Students
INSERT INTO users (name, email, password, role, department, class) VALUES
('John Doe', 'john@college.edu', '$2a$10$YourHashedPasswordHere', 'student', 'Computer Science', 'CS-A'),
('Jane Smith', 'jane@college.edu', '$2a$10$YourHashedPasswordHere', 'student', 'Computer Science', 'CS-B'),
('Mike Johnson', 'mike@college.edu', '$2a$10$YourHashedPasswordHere', 'student', 'Electronics', 'EC-A');

-- Staff
INSERT INTO users (name, email, password, role, department) VALUES
('Prof. Sarah Wilson', 'sarah@college.edu', '$2a$10$YourHashedPasswordHere', 'staff', 'Computer Science'),
('Prof. Robert Brown', 'robert@college.edu', '$2a$10$YourHashedPasswordHere', 'staff', 'Electronics');

-- HODs
INSERT INTO users (name, email, password, role, department) VALUES
('Dr. Emily Davis', 'emily@college.edu', '$2a$10$YourHashedPasswordHere', 'hod', 'Computer Science'),
('Dr. Michael Chen', 'michael@college.edu', '$2a$10$YourHashedPasswordHere', 'hod', 'Electronics');

-- Principal
INSERT INTO users (name, email, password, role) VALUES
('Dr. James Anderson', 'principal@college.edu', '$2a$10$YourHashedPasswordHere', 'principal');
