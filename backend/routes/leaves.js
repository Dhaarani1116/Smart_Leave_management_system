const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getPendingApprovals,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  getLeaveById,
  getLeaveStats,
  getConflictDetection,
  setTempApprover,
  removeTempApprover,
  getAvailableApprovers,
} = require('../controllers/leaveController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Student routes
router.post('/apply', authMiddleware, roleMiddleware(['student', 'staff', 'hod', 'principal']), applyLeave);
router.get('/my-leaves', authMiddleware, getMyLeaves);

// Approver routes
router.get('/pending-approvals', authMiddleware, roleMiddleware(['staff', 'hod', 'principal']), getPendingApprovals);
router.get('/available-approvers', authMiddleware, roleMiddleware(['staff', 'hod']), getAvailableApprovers);

// Management routes
router.get('/all', authMiddleware, roleMiddleware(['staff', 'hod', 'principal']), getAllLeaves);
router.get('/stats', authMiddleware, roleMiddleware(['staff', 'hod', 'principal']), getLeaveStats);
router.get('/conflicts', authMiddleware, roleMiddleware(['staff', 'hod', 'principal']), getConflictDetection);

// Temp approver management
router.post('/temp-approver', authMiddleware, roleMiddleware(['staff', 'hod']), setTempApprover);
router.delete('/temp-approver', authMiddleware, roleMiddleware(['staff', 'hod']), removeTempApprover);

// Leave actions
router.get('/:id', authMiddleware, getLeaveById);
router.put('/:id/approve', authMiddleware, roleMiddleware(['staff', 'hod', 'principal']), approveLeave);
router.put('/:id/reject', authMiddleware, roleMiddleware(['staff', 'hod', 'principal']), rejectLeave);

module.exports = router;
