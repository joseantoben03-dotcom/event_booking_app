const { Notification } = require('../models');

async function listNotifications(req, res) {
  const notifications = await Notification.findAll({
    where: { recipient_id: req.user.id, read_at: null },
    order: [['created_at', 'DESC']],
    limit: 50,
  });
  return res.json(notifications);
}

async function markNotificationsRead(req, res) {
  await Notification.update({ read_at: new Date() }, { where: { recipient_id: req.user.id, read_at: null } });
  return res.json({ ok: true });
}

module.exports = { listNotifications, markNotificationsRead };