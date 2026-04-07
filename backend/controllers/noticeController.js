const { Notice, Reply, User } = require('../models');
const { Op } = require('sequelize');

// Create a new notice (Principal only)
const createNotice = async (req, res) => {
  try {
    const { title, message, targetRole, targetDepartment, priority } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    // Only principal can send notices
    if (senderRole !== 'principal') {
      return res.status(403).json({ message: 'Only Principal can send notices' });
    }

    const notice = await Notice.create({
      title,
      message,
      senderId,
      senderRole,
      targetRole: targetRole || 'all',
      targetDepartment,
      priority: priority || 'medium',
    });

    res.status(201).json({
      message: 'Notice created successfully',
      notice,
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all notices for the current user
const getNotices = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    let whereClause = {
      isActive: true,
      [Op.or]: [
        { targetRole: 'all' },
        { targetRole: userRole },
      ],
    };

    // If target department is specified, filter by department
    if (userRole !== 'principal') {
      whereClause[Op.or].push({
        targetDepartment: { [Op.or]: [userDept, null] },
      });
    }

    const notices = await Notice.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['name', 'role'],
        },
        {
          model: Reply,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'role', 'department'],
            },
          ],
        },
      ],
    });

    res.json(notices);
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get notices sent by principal (for principal dashboard)
const getSentNotices = async (req, res) => {
  try {
    const senderId = req.user.id;

    const notices = await Notice.findAll({
      where: { senderId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Reply,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'role', 'department'],
            },
          ],
        },
      ],
    });

    res.json(notices);
  } catch (error) {
    console.error('Get sent notices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reply to a notice
const replyToNotice = async (req, res) => {
  try {
    const { noticeId, message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if notice exists
    const notice = await Notice.findByPk(noticeId);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Create reply
    const reply = await Reply.create({
      noticeId,
      userId,
      userRole,
      message,
    });

    res.status(201).json({
      message: 'Reply added successfully',
      reply,
    });
  } catch (error) {
    console.error('Reply to notice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a notice (Principal only)
const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== 'principal') {
      return res.status(403).json({ message: 'Only Principal can delete notices' });
    }

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await notice.update({ isActive: false });

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getSentNotices,
  replyToNotice,
  deleteNotice,
};
