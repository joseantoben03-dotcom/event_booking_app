const { Notification, User } = require('../models');

async function notifyUsers({ recipientIds, eventId, type, message }) {
  const ids = [...new Set(recipientIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  await Notification.bulkCreate(ids.map((recipient_id) => ({ recipient_id, event_id: eventId, type, message })));
}

async function notifyRole({ designation, department, eventId, type, message }) {
  const where = { designation };
  if (department) where.department = department;
  const users = await User.findAll({ attributes: ['id'], where });
  await notifyUsers({ recipientIds: users.map((user) => user.id), eventId, type, message });
}

module.exports = { notifyUsers, notifyRole };