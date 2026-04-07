const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  getSentNotices,
  replyToNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get notices for current user
router.get('/', authMiddleware, getNotices);

// Get notices sent by principal
router.get('/sent', authMiddleware, roleMiddleware(['principal']), getSentNotices);

// Create notice (Principal only)
router.post('/', authMiddleware, roleMiddleware(['principal']), createNotice);

// Reply to notice
router.post('/reply', authMiddleware, replyToNotice);

// Delete notice (Principal only)
router.put('/:id/delete', authMiddleware, roleMiddleware(['principal']), deleteNotice);

module.exports = router;
