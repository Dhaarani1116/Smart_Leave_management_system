const { Op, Sequelize } = require('sequelize');
const { Leave, User, LeaveHistory, Notification, sequelize } = require('../models');

// Get approval chain based on requester role
const getApprovalChain = (requesterRole) => {
  switch (requesterRole) {
    case 'student':
      return ['staff', 'hod']; // Staff then HOD (final)
    case 'staff':
      return ['hod']; // HOD only (final)
    case 'hod':
      return ['principal']; // Principal only (final)
    case 'principal':
      return ['system']; // Auto-approved
    default:
      return ['staff', 'hod'];
  }
};

// Get next approver in chain
const getNextApprover = (chain, currentRole) => {
  const currentIndex = chain.indexOf(currentRole);
  if (currentIndex === -1 || currentIndex === chain.length - 1) {
    return null; // End of chain
  }
  return chain[currentIndex + 1];
};

// Find available approver (considering temp approvers)
const findAvailableApprover = async (role, department, excludeUserId = null) => {
  // First try to find active user in role
  let whereClause = {
    role,
    is_on_leave: false,
  };
  
  if (department && role !== 'principal') {
    whereClause.department = department;
  }
  
  if (excludeUserId) {
    whereClause.id = { [Op.ne]: excludeUserId };
  }
  
  let approver = await User.findOne({ where: whereClause });
  
  if (approver) {
    // Check if this approver has a substitute assigned
    if (approver.substitute_id && approver.substitute_expiry > new Date()) {
      const substitute = await User.findByPk(approver.substitute_id);
      if (substitute && !substitute.is_on_leave) {
        return { approver: substitute, isTemp: true, originalApprover: approver };
      }
    }
    return { approver, isTemp: false };
  }
  
  // If no active approver found, check for substitutes
  const unavailableApprovers = await User.findAll({
    where: {
      role,
      is_on_leave: true,
      substitute_id: { [Op.not]: null },
      substitute_expiry: { [Op.gt]: new Date() },
    },
  });
  
  for (const unavailable of unavailableApprovers) {
    const substitute = await User.findByPk(unavailable.substitute_id);
    if (substitute && !substitute.is_on_leave) {
      if (department && substitute.department !== department && role !== 'principal') {
        continue; // Skip if department doesn't match
      }
      return { approver: substitute, isTemp: true, originalApprover: unavailable };
    }
  }
  
  return null;
};

const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason, leaveType, requesterName, requesterDepartment, requesterYear } = req.body;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const requesterDept = req.user.department;

    console.log('Apply leave request:', { requesterId, requesterRole, requesterDept, requesterName, requesterDepartment });

    // Validate required fields
    if (!fromDate || !toDate || !reason || !leaveType) {
      return res.status(400).json({ message: 'Missing required fields: fromDate, toDate, reason, leaveType' });
    }

    // Get approval chain for this role
    const approvalChain = getApprovalChain(requesterRole);
    console.log('Approval chain:', approvalChain);
    
    // If principal, auto-approve
    if (requesterRole === 'principal') {
      const leave = await Leave.create({
        requesterId,
        requesterRole,
        requesterName: requesterName || req.user.name,
        requesterDepartment: requesterDepartment || requesterDept || 'N/A',
        requesterYear: requesterYear || null,
        fromDate,
        toDate,
        reason,
        leaveType,
        status: 'Auto_Approved',
        approvalChain,
        finalApproverId: requesterId,
        finalApprovedAt: new Date(),
      });

      await LeaveHistory.create({
        leaveId: leave.id,
        actionBy: requesterId,
        role: 'principal',
        action: 'auto_approved',
        comment: 'Auto-approved as Principal',
      });

      return res.status(201).json({ 
        message: 'Leave auto-approved as Principal', 
        leave,
        autoApproved: true 
      });
    }

    // Find first approver in chain
    const firstApproverRole = approvalChain[0];
    const approverResult = await findAvailableApprover(firstApproverRole, requesterDept, requesterId);
    
    console.log('First approver role:', firstApproverRole);
    console.log('Approver result:', approverResult ? { id: approverResult.approver.id, name: approverResult.approver.name } : 'No approver found');
    
    if (!approverResult) {
      return res.status(400).json({ 
        message: `No available ${firstApproverRole} found for approval. Please ensure a ${firstApproverRole} is assigned to your department.` 
      });
    }

    // Find HOD and Staff for the leave record
    let staffId = null;
    let hodId = null;
    
    if (requesterRole === 'student') {
      // Find staff for this student
      const staff = await User.findOne({ 
        where: { role: 'staff', department: requesterDept, is_on_leave: false } 
      });
      staffId = staff?.id || approverResult.approver.id;
      
      // Find HOD
      const hod = await User.findOne({ 
        where: { role: 'hod', department: requesterDept, is_on_leave: false } 
      });
      hodId = hod?.id;
    } else if (requesterRole === 'staff') {
      const hod = await User.findOne({ 
        where: { role: 'hod', department: requesterDept, is_on_leave: false } 
      });
      hodId = hod?.id;
    }

    const leave = await Leave.create({
      requesterId,
      requesterRole,
      requesterName: requesterName || req.user.name,
      requesterDepartment: requesterDepartment || requesterDept || 'N/A',
      requesterYear: requesterYear || null,
      fromDate,
      toDate,
      reason,
      leaveType,
      status: 'Pending',
      currentApproverId: approverResult.approver.id,
      currentApproverRole: firstApproverRole,
      isTempApprover: approverResult.isTemp,
      tempApproverId: approverResult.isTemp ? approverResult.approver.id : null,
      approvalChain,
      staffId,
      hodId,
    });

    // Create history
    await LeaveHistory.create({
      leaveId: leave.id,
      actionBy: requesterId,
      role: requesterRole,
      action: 'applied',
      comment: `Submitted to ${approverResult.isTemp ? 'temporary ' : ''}${firstApproverRole}`,
    });

    // Notify approver
    await Notification.create({
      userId: approverResult.approver.id,
      message: `New leave request from ${requesterName || req.user.name} (${requesterRole}) requires your approval`,
      type: 'info',
      leaveId: leave.id,
    });

    // Notify requester
    await Notification.create({
      userId: requesterId,
      message: `Leave submitted to ${approverResult.isTemp ? 'temporary ' : ''}${firstApproverRole} for approval`,
      type: 'success',
      leaveId: leave.id,
    });

    res.status(201).json({ 
      message: 'Leave applied successfully', 
      leave,
      currentApprover: approverResult.approver.name,
      isTempApprover: approverResult.isTemp,
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message, details: error.stack });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { requesterId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: LeaveHistory,
          as: 'history',
          include: [
            {
              model: User,
              as: 'actionUser',
              attributes: ['name', 'role'],
            },
          ],
        },
        {
          model: User,
          as: 'currentApprover',
          attributes: ['name', 'role', 'department'],
        },
      ],
    });
    res.json(leaves);
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    // Build where clause - show leaves where current approver is this user
    // OR where this user is the temp approver
    const whereClause = {
      status: { [Op.in]: ['Pending', 'In_Progress'] },
      [Op.or]: [
        { currentApproverId: userId },
        { tempApproverId: userId },
      ],
    };

    const leaves = await Leave.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['name', 'email', 'department', 'class', 'role'],
        },
        {
          model: LeaveHistory,
          as: 'history',
          include: [
            {
              model: User,
              as: 'actionUser',
              attributes: ['name', 'role'],
            },
          ],
        },
      ],
    });

    res.json(leaves);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;
    const { status, department } = req.query;
    
    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    // Role-based filtering with department scope
    if (userRole === 'staff') {
      // Staff sees leaves from their department students
      whereClause['$requester.department$'] = userDept;
    } else if (userRole === 'hod') {
      // HOD sees leaves from their department
      whereClause['$requester.department$'] = userDept;
    }
    // Principal sees all leaves

    if (department && userRole === 'principal') {
      whereClause['$requester.department$'] = department;
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['name', 'email', 'department', 'class', 'role'],
        },
        {
          model: User,
          as: 'currentApprover',
          attributes: ['name', 'role'],
        },
        {
          model: LeaveHistory,
          as: 'history',
          include: [
            {
              model: User,
              as: 'actionUser',
              attributes: ['name', 'role'],
            },
          ],
        },
      ],
    });

    res.json(leaves);
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    const leave = await Leave.findByPk(id, {
      include: [{ model: User, as: 'requester' }],
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Verify this user is the current approver
    if (leave.currentApproverId !== userId && leave.tempApproverId !== userId) {
      return res.status(403).json({ message: 'Not authorized to approve this leave' });
    }

    const approvalChain = leave.approvalChain || getApprovalChain(leave.requesterRole);
    const currentRole = leave.currentApproverRole;
    const nextApproverRole = getNextApprover(approvalChain, currentRole);

    let action;
    let notificationMessage;

    if (!nextApproverRole || nextApproverRole === 'system') {
      // Final approval
      leave.status = 'Approved';
      leave.finalApproverId = userId;
      leave.finalApprovedAt = new Date();
      action = 'approved';
      notificationMessage = `Your leave request has been fully approved by ${userRole}${leave.isTempApprover ? ' (temporary approver)' : ''}`;
    } else {
      // Forward to next approver
      leave.status = 'In_Progress';
      
      // Find next available approver
      const nextApproverResult = await findAvailableApprover(
        nextApproverRole, 
        leave.requester.department,
        leave.requesterId
      );
      
      if (!nextApproverResult) {
        return res.status(400).json({ 
          message: `No available ${nextApproverRole} found for next approval` 
        });
      }

      leave.currentApproverId = nextApproverResult.approver.id;
      leave.currentApproverRole = nextApproverRole;
      leave.isTempApprover = nextApproverResult.isTemp;
      leave.tempApproverId = nextApproverResult.isTemp ? nextApproverResult.approver.id : null;
      
      action = `forwarded_to_${nextApproverRole}`;
      notificationMessage = `Your leave has been approved by ${userRole} and forwarded to ${nextApproverRole}`;

      // Notify next approver
      await Notification.create({
        userId: nextApproverResult.approver.id,
        message: `Leave request from ${leave.requester.name} forwarded for your approval as ${nextApproverRole}`,
        type: 'info',
        leaveId: leave.id,
      });
    }

    // Save comments
    const comments = leave.comments || [];
    comments.push({
      by: userId,
      role: userRole,
      comment,
      isTemp: leave.isTempApprover,
      timestamp: new Date(),
    });
    leave.comments = comments;

    await leave.save();

    // Create history
    await LeaveHistory.create({
      leaveId: leave.id,
      actionBy: userId,
      role: userRole,
      action,
      comment: comment || `Approved as ${userRole}${leave.isTempApprover ? ' (temporary)' : ''}`,
    });

    // Notify requester
    await Notification.create({
      userId: leave.requesterId,
      message: notificationMessage,
      type: 'success',
      leaveId: leave.id,
    });

    res.json({ 
      message: nextApproverRole && nextApproverRole !== 'system' 
        ? 'Leave forwarded to next approver' 
        : 'Leave approved successfully', 
      leave,
      nextApprover: nextApproverRole,
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const leave = await Leave.findByPk(id, {
      include: [{ model: User, as: 'requester' }],
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Verify this user is the current approver
    if (leave.currentApproverId !== userId && leave.tempApproverId !== userId) {
      return res.status(403).json({ message: 'Not authorized to reject this leave' });
    }

    leave.status = 'Rejected';
    leave.rejectedById = userId;
    leave.rejectedAt = new Date();
    leave.rejectionReason = comment;

    // Save rejection comment
    const comments = leave.comments || [];
    comments.push({
      by: userId,
      role: userRole,
      comment,
      isTemp: leave.isTempApprover,
      action: 'rejected',
      timestamp: new Date(),
    });
    leave.comments = comments;

    await leave.save();

    // Create history
    await LeaveHistory.create({
      leaveId: leave.id,
      actionBy: userId,
      role: userRole,
      action: 'rejected',
      comment: comment || `Rejected by ${userRole}`,
    });

    // Notify requester
    await Notification.create({
      userId: leave.requesterId,
      message: `Your leave request has been rejected by ${userRole}${leave.isTempApprover ? ' (temporary approver)' : ''}`,
      type: 'warning',
      leaveId: leave.id,
    });

    res.json({ message: 'Leave rejected successfully', leave });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findByPk(id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['name', 'email', 'department', 'class', 'role'],
        },
        {
          model: User,
          as: 'currentApprover',
          attributes: ['name', 'role'],
        },
        {
          model: User,
          as: 'tempApprover',
          attributes: ['name', 'role'],
        },
        {
          model: User,
          as: 'finalApprover',
          attributes: ['name', 'role'],
        },
        {
          model: LeaveHistory,
          as: 'history',
          include: [
            {
              model: User,
              as: 'actionUser',
              attributes: ['name', 'role'],
            },
          ],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json(leave);
  } catch (error) {
    console.error('Get leave by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLeaveStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;
    
    let whereClause = {};
    
    // Role-based filtering
    if (userRole === 'staff' || userRole === 'hod') {
      whereClause['$requester.department$'] = userDept;
    }

    // Base counts
    const totalLeaves = await Leave.count({ 
      where: whereClause,
      include: [{ model: User, as: 'requester', attributes: [] }],
    });
    
    const pending = await Leave.count({ 
      where: { ...whereClause, status: { [Op.in]: ['Pending', 'In_Progress'] } },
      include: [{ model: User, as: 'requester', attributes: [] }],
    });
    
    const approved = await Leave.count({ 
      where: { ...whereClause, status: { [Op.in]: ['Approved', 'Auto_Approved'] } },
      include: [{ model: User, as: 'requester', attributes: [] }],
    });
    
    const rejected = await Leave.count({ 
      where: { ...whereClause, status: 'Rejected' },
      include: [{ model: User, as: 'requester', attributes: [] }],
    });

    // Get monthly stats
    const monthlyStats = await Leave.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('Leave.createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('Leave.id')), 'count'],
      ],
      include: [{ model: User, as: 'requester', attributes: [] }],
      group: [sequelize.fn('MONTH', sequelize.col('Leave.createdAt'))],
      raw: true,
    });

    // Get leave type distribution
    const leaveTypeStats = await Leave.findAll({
      where: whereClause,
      attributes: ['leaveType', [sequelize.fn('COUNT', sequelize.col('Leave.id')), 'count']],
      include: [{ model: User, as: 'requester', attributes: [] }],
      group: ['leaveType'],
      raw: true,
    });

    // Get frequent absentees (only for students)
    const frequentAbsentees = await Leave.findAll({
      where: { ...whereClause, '$requester.role$': 'student' },
      attributes: ['requesterId', [sequelize.fn('COUNT', sequelize.col('Leave.id')), 'leaveCount']],
      include: [
        { 
          model: User, 
          as: 'requester', 
          attributes: ['name', 'department'],
          where: { role: 'student' }
        }
      ],
      group: ['requesterId'],
      having: sequelize.literal('COUNT(Leave.id) > 2'),
      raw: true,
    });

    // Department-wise stats (for principal)
    let departmentStats = null;
    if (userRole === 'principal') {
      const deptQuery = await sequelize.query(
        `SELECT requester.department, COUNT(Leaves.id) as count
         FROM Leaves
         INNER JOIN Users as requester ON Leaves.requesterId = requester.id
         WHERE requester.department IS NOT NULL
         GROUP BY requester.department`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      departmentStats = deptQuery;
    }

    res.json({
      totalLeaves,
      pending,
      approved,
      rejected,
      monthlyStats,
      leaveTypeStats,
      frequentAbsentees,
      departmentStats,
      role: userRole,
      department: userDept,
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getConflictDetection = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;
    
    let whereClause = {
      status: { [Op.in]: ['Pending', 'In_Progress', 'Approved'] },
    };
    
    if (userRole === 'staff' || userRole === 'hod') {
      whereClause['$requester.department$'] = userDept;
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['name', 'department', 'class', 'role'],
        },
      ],
    });

    // Group leaves by date
    const dateGroups = {};
    leaves.forEach((leave) => {
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);
      
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!dateGroups[dateStr]) {
          dateGroups[dateStr] = [];
        }
        dateGroups[dateStr].push(leave);
      }
    });

    // Find dates with many leaves (potential conflicts)
    const conflicts = Object.entries(dateGroups)
      .filter(([date, leaves]) => leaves.length >= 3)
      .map(([date, leaves]) => ({
        date,
        count: leaves.length,
        department: leaves[0].requester.department,
        leaves: leaves.map(l => ({
          id: l.id,
          requester: l.requester,
          leaveType: l.leaveType,
          status: l.status,
        })),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(conflicts);
  } catch (error) {
    console.error('Get conflict detection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Substitute Management
const setTempApprover = async (req, res) => {
  try {
    const { substitute_id, expiryDate } = req.body;
    const userId = req.user.id;

    // Verify substitute exists and is valid
    const substitute = await User.findByPk(substitute_id);
    if (!substitute) {
      return res.status(404).json({ message: 'Substitute not found' });
    }

    // Cannot assign to self
    if (substitute_id === userId) {
      return res.status(400).json({ message: 'Cannot assign yourself as substitute' });
    }

    // Should be same or higher role
    const roleHierarchy = { staff: 1, hod: 2, principal: 3 };
    if (roleHierarchy[substitute.role] < roleHierarchy[req.user.role]) {
      return res.status(400).json({ message: 'Substitute must be same or higher role' });
    }

    await User.update(
      {
        substitute_id,
        substitute_expiry: new Date(expiryDate),
        is_on_leave: true,
      },
      { where: { id: userId } }
    );

    res.json({ 
      message: 'Substitute set successfully',
      substitute: substitute.name,
      expiryDate,
    });
  } catch (error) {
    console.error('Set substitute error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const removeTempApprover = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.update(
      {
        substitute_id: null,
        substitute_expiry: null,
        is_on_leave: false,
      },
      { where: { id: userId } }
    );

    res.json({ message: 'Substitute removed successfully' });
  } catch (error) {
    console.error('Remove substitute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailableApprovers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const userId = req.user.id;

    const whereClause = {
      role,
      is_on_leave: false,
      id: { [Op.ne]: userId },
    };

    if (department && role !== 'principal') {
      whereClause.department = department;
    }

    const approvers = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'department', 'role'],
    });

    res.json(approvers);
  } catch (error) {
    console.error('Get available approvers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
