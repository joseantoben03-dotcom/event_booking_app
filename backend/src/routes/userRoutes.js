const express = require('express');
const { listUsers, getUser } = require('../controllers/userController');
const { ensureAuthenticated, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(ensureAuthenticated, requireRole('admin'));
router.get('/', listUsers);
router.get('/:id', getUser);

module.exports = router;