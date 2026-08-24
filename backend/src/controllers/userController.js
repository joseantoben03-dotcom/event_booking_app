const { Op } = require('sequelize');
const { User } = require('../models');

// GET /users?search=&designation=  (admin only)
async function listUsers(req, res) {
  const { search, designation } = req.query;
  const where = {};

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [{ name: { [Op.like]: term } }, { email: { [Op.like]: term } }, { department: { [Op.like]: term } }];
  }
  if (designation) where.designation = designation;

  const users = await User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'contactno', 'designation', 'department'],
    order: [['name', 'ASC']],
    limit: 50,
  });

  return res.json(users);
}

// GET /users/:id  (admin only)
async function getUser(req, res) {
  const user = await User.findByPk(req.params.id, {
    attributes: ['id', 'name', 'email', 'contactno', 'designation', 'department'],
  });
  if (!user) return res.status(404).json({ error: 'Not found', details: 'User does not exist.' });
  return res.json(user);
}

module.exports = { listUsers, getUser };
