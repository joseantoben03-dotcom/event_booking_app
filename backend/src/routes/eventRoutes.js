const express = require('express');
const { body } = require('express-validator');
const {
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  listEvents,
  listAvailability,
  getEvent,
  approveHod,
  approvePrincipal,
  approveCampusManager,
  reassignVenue,
  reassignSlot,
} = require('../controllers/eventController');
const { ensureAuthenticated, requireRole } = require('../middleware/authMiddleware');
const { Venue } = require('../models');

const router = express.Router();

const eventValidation = [
  body('event_name').trim().notEmpty().withMessage('event_name is required'),
  body('venue')
    .trim()
    .notEmpty()
    .withMessage('venue is required')
    .bail()
    .custom(async (value) => {
      const match = await Venue.findOne({ where: { name: value } });
      if (!match) throw new Error('Selected venue is not recognized.');
      return true;
    }),
  body('purpose').trim().notEmpty().withMessage('purpose is required'),
  body('organizer').trim().notEmpty().withMessage('organizer is required'),
  body('no_of_participants')
    .isInt({ gt: 0 })
    .withMessage('no_of_participants must be a positive integer'),
  body('event_date').isISO8601().withMessage('event_date must be a valid date (YYYY-MM-DD)'),
  body('start_time')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage('start_time must be in HH:MM format'),
  body('end_time')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage('end_time must be in HH:MM format'),
];

router.use(ensureAuthenticated);

// Venue list - readable by anyone authenticated; mutations are Campus
// Manager only (Campus Manager now holds all the rights the old Admin
// role used to have).
router.get('/venues', async (req, res) => {
  const venues = await Venue.findAll({ attributes: ['id', 'name'], order: [['id', 'ASC']] });
  res.json(venues.map((v) => ({ id: v.id, name: v.name })));
});

router.post('/venues', requireRole('campus_manager'), async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Validation failed', details: 'Venue name is required.' });
  const existing = await Venue.findOne({ where: { name } });
  if (existing) return res.status(409).json({ error: 'Duplicate', details: 'A venue with this name already exists.' });
  const venue = await Venue.create({ name });
  res.status(201).json({ id: venue.id, name: venue.name });
});

router.patch('/venues/:id', requireRole('campus_manager'), async (req, res) => {
  const venue = await Venue.findByPk(req.params.id);
  if (!venue) return res.status(404).json({ error: 'Not found', details: 'Venue does not exist.' });
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Validation failed', details: 'Venue name is required.' });
  await venue.update({ name });
  res.json({ id: venue.id, name: venue.name });
});

router.delete('/venues/:id', requireRole('campus_manager'), async (req, res) => {
  const venue = await Venue.findByPk(req.params.id);
  if (!venue) return res.status(404).json({ error: 'Not found', details: 'Venue does not exist.' });
  try {
    await venue.destroy();
    res.json({ deleted: true, id: venue.id });
  } catch (err) {
    res.status(409).json({
      error: 'Cannot delete',
      details: 'This venue is still referenced elsewhere (e.g. a user is assigned to it) and cannot be deleted.',
    });
  }
});

// Must be registered before '/:id' so Express doesn't treat "availability"
// as an :id value.
router.get('/availability', listAvailability);

router.post('/', requireRole('ap', 'hod', 'campus_manager'), eventValidation, createEvent);
router.get('/', listEvents);
router.get('/:id', getEvent);
router.patch('/:id', eventValidation, updateEvent);
router.patch('/:id/cancel', cancelEvent);
router.patch('/:id/reassign-venue', requireRole('campus_manager'), reassignVenue);
router.patch('/:id/reassign-slot', requireRole('campus_manager'), reassignSlot);
router.delete('/:id', requireRole('campus_manager'), deleteEvent);

router.patch('/:id/approve-hod', requireRole('hod', 'campus_manager'), approveHod);
router.patch('/:id/approve-principal', requireRole('principal', 'campus_manager'), approvePrincipal);
router.patch('/:id/approve-campus-manager', requireRole('campus_manager'), approveCampusManager);

module.exports = router;
