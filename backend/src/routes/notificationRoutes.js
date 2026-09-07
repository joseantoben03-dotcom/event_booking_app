const express = require('express');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { listNotifications, markNotificationsRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(ensureAuthenticated);
router.get('/', listNotifications);
router.patch('/read', markNotificationsRead);

module.exports = router;