const { validationResult } = require('express-validator');
const { Event, User, Venue } = require('../models');
const { serializeEvent, computeStatus, isSlotFree, isFullyPending, hasStarted } = require('../services/eventService');

function normalizedDesignation(user) {
  return typeof user.designation === 'string' ? user.designation.trim().toLowerCase() : '';
}

// Shared by create + edit: throws a 409-worthy conflict if the venue/date/time
// range overlaps an existing request that isn't rejected/cancelled/expired.
async function findClashingEvent({ venue, event_date, start_time, end_time, excludeId }) {
  const sameDayVenue = await Event.findAll({ where: { venue, event_date } });
  return sameDayVenue.find(
    (event) =>
      event.id !== excludeId &&
      !isSlotFree(computeStatus(event)) &&
      event.start_time < end_time &&
      event.end_time > start_time
  );
}

// POST /events  (ap, hod, or campus_manager)
// - Campus Managers can book on behalf of any user via on_behalf_of_user_id.
// - Whenever the request is initiated by a Campus Manager (booking for
//   themselves or on behalf of someone else), the booking is instantly and
//   fully approved - no one else needs to sign off on it.
async function createEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { venue, event_name, purpose, organizer, no_of_participants, event_date, start_time, end_time, on_behalf_of_user_id } = req.body;
  let creator = req.user;
  const requesterIsCampusManager = normalizedDesignation(req.user) === 'campus_manager';

  if (requesterIsCampusManager && on_behalf_of_user_id) {
    const target = await User.findByPk(on_behalf_of_user_id);
    if (!target) {
      return res.status(404).json({ error: 'Not found', details: 'Selected user does not exist.' });
    }
    creator = target;
  }

  const isHod = normalizedDesignation(creator) === 'hod';

  if (start_time >= end_time) {
    return res.status(400).json({ error: 'Validation failed', details: 'end_time must be later than start_time.' });
  }
  if (start_time < '09:00') {
    return res.status(400).json({ error: 'Validation failed', details: 'Bookings cannot start before 9:00 AM.' });
  }
  if (hasStarted(event_date, start_time)) {
    return res.status(400).json({ error: 'Booking expired', details: 'Bookings cannot be created for a date or time that has already passed.' });
  }

  const clashing = await findClashingEvent({ venue, event_date, start_time, end_time });
  if (clashing) {
    return res.status(409).json({
      error: 'Slot unavailable',
      details: `${venue} is already requested/booked during the selected time range on ${event_date}.`,
    });
  }

  // Campus Managers hold final authority - anything they book is confirmed
  // immediately, skipping the normal HOD -> Principal -> Campus Manager chain.
  const approvals = requesterIsCampusManager
    ? { hod_approved: 'approved', principal_approved: 'approved', campus_manager_approved: 'approved' }
    : { hod_approved: isHod ? 'approved' : 'pending', principal_approved: 'pending', campus_manager_approved: 'pending' };
  const approvalTimes = requesterIsCampusManager
    ? { hod_approved_at: new Date(), principal_approved_at: new Date(), campus_manager_approved_at: new Date() }
    : isHod
    ? { hod_approved_at: new Date() }
    : {};

  const event = await Event.create({
    user_id: creator.id,
    venue,
    event_name,
    purpose,
    organizer,
    no_of_participants,
    event_date,
    start_time,
    end_time,
    ...approvals,
    ...approvalTimes,
  });

  const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
  return res.status(201).json(serializeEvent(withCreator));
}

// PATCH /events/:id  - creator only, and only while fully pending (no
// approval step has moved off 'pending' yet).
async function updateEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });

  if (event.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden', details: 'You can only edit your own bookings.' });
  }
  if (!isFullyPending(event)) {
    return res.status(400).json({
      error: 'Locked',
      details: 'This booking can no longer be edited once an approval step has been actioned.',
    });
  }

  const { venue, event_name, purpose, organizer, no_of_participants, event_date, start_time, end_time } = req.body;

  if (start_time >= end_time) {
    return res.status(400).json({ error: 'Validation failed', details: 'end_time must be later than start_time.' });
  }
  if (start_time < '09:00') {
    return res.status(400).json({ error: 'Validation failed', details: 'Bookings cannot start before 9:00 AM.' });
  }
  if (hasStarted(event_date, start_time)) {
    return res.status(400).json({ error: 'Booking expired', details: 'Bookings cannot be moved to a date or time that has already passed.' });
  }

  const clashing = await findClashingEvent({ venue, event_date, start_time, end_time, excludeId: event.id });
  if (clashing) {
    return res.status(409).json({
      error: 'Slot unavailable',
      details: `${venue} is already requested/booked during the selected time range on ${event_date}.`,
    });
  }

  await event.update({ venue, event_name, purpose, organizer, no_of_participants, event_date, start_time, end_time });
  const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
  return res.json(serializeEvent(withCreator));
}

// PATCH /events/:id/cancel - creator only, only before the event's scheduled
// start time. Frees the slot up for someone else to book.
async function cancelEvent(req, res) {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });

  if (event.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden', details: 'You can only cancel your own bookings.' });
  }

  const status = computeStatus(event);
  if (isSlotFree(status)) {
    return res.status(400).json({ error: 'Already inactive', details: `This booking is already ${status.toLowerCase()}.` });
  }

  const scheduledStart = new Date(`${event.event_date}T${event.start_time}`);
  if (scheduledStart <= new Date()) {
    return res.status(400).json({ error: 'Too late', details: 'This event has already started or passed and cannot be cancelled.' });
  }

  await event.update({ is_cancelled: true, cancelled_at: new Date() });
  const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
  return res.json(serializeEvent(withCreator));
}

// GET /events  (auth required) supports ?status=&department=&creator=&venue=&event_date=
async function listEvents(req, res) {
  const { status, department, creator, venue, event_date } = req.query;
  const where = {};
  const include = { model: User, as: 'creator', where: {} };

  if (creator) where.user_id = creator;
  if (venue) where.venue = venue;
  if (event_date) where.event_date = event_date;
  if (department) include.where.department = department;
  if (Object.keys(include.where).length === 0) delete include.where;

  const events = await Event.findAll({ where, include, order: [['created_at', 'DESC']] });
  let serialized = events.map(serializeEvent);

  if (status) {
    const filters = {
      pending_hod: (e) => e.hod_approved === 'pending' && !e.is_cancelled,
      pending_principal: (e) => e.hod_approved === 'approved' && e.principal_approved === 'pending' && !e.is_cancelled,
      pending_campus_manager: (e) =>
        e.hod_approved === 'approved' && e.principal_approved === 'approved' && e.campus_manager_approved === 'pending' && !e.is_cancelled,
      fully_approved: (e) => e.status === 'Fully approved',
      rejected: (e) => e.status.startsWith('Rejected'),
      cancelled: (e) => e.status === 'Cancelled',
    };
    if (filters[status]) serialized = serialized.filter(filters[status]);
  }

  return res.json(serialized);
}

// GET /events/availability?venue=&event_date=  - lightweight lookup of every
// active (non free-able) booking for a venue on a given day, used by the
// booking form to grey out taken time ranges.
async function listAvailability(req, res) {
  const { venue, event_date } = req.query;
  if (!venue || !event_date) {
    return res.status(400).json({ error: 'Validation failed', details: 'venue and event_date are required.' });
  }
  const events = await Event.findAll({ where: { venue, event_date }, include: { model: User, as: 'creator' } });
  const active = events.map(serializeEvent).filter((e) => !isSlotFree(e.status));
  return res.json(active);
}

// GET /events/:id
async function getEvent(req, res) {
  const event = await Event.findByPk(req.params.id, { include: { model: User, as: 'creator' } });
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });
  return res.json(serializeEvent(event));
}

// PATCH /events/:id/approve-hod - HOD only for their own department; Campus
// Managers can approve/reject on behalf of any department (direct override).
async function approveHod(req, res) {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Validation failed', details: "status must be 'approved' or 'rejected'." });
  }

  const event = await Event.findByPk(req.params.id, { include: { model: User, as: 'creator' } });
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });

  const isCampusManager = normalizedDesignation(req.user) === 'campus_manager';
  if (!isCampusManager && (!event.creator || event.creator.department !== req.user.department)) {
    return res.status(403).json({
      error: 'Forbidden',
      details: 'You can only approve requests from your own department.',
    });
  }

  await event.update({ hod_approved: status, hod_approved_at: new Date() });
  const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
  return res.json(serializeEvent(withCreator));
}

function makeApprovalHandler(field) {
  return async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Validation failed', details: "status must be 'approved' or 'rejected'." });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });

    await event.update({ [field]: status, [`${field}_at`]: new Date() });
    const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
    return res.json(serializeEvent(withCreator));
  };
}

const approvePrincipal = makeApprovalHandler('principal_approved');
const approveCampusManager = makeApprovalHandler('campus_manager_approved');

// PATCH /events/:id/reassign-venue - Campus Manager only. Moves an existing
// booking to a different venue (e.g. to free up a higher-priority venue),
// keeping the same date/time and approval state.
async function reassignVenue(req, res) {
  const venue = (req.body.venue || '').trim();
  if (!venue) {
    return res.status(400).json({ error: 'Validation failed', details: 'venue is required.' });
  }

  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });

  const venueExists = await Venue.findOne({ where: { name: venue } });
  if (!venueExists) {
    return res.status(400).json({ error: 'Validation failed', details: 'Selected venue is not recognized.' });
  }
  if (venue === event.venue) {
    return res.status(400).json({ error: 'Validation failed', details: 'This booking is already at that venue.' });
  }

  const clashing = await findClashingEvent({
    venue,
    event_date: event.event_date,
    start_time: event.start_time,
    end_time: event.end_time,
    excludeId: event.id,
  });
  if (clashing) {
    return res.status(409).json({
      error: 'Slot unavailable',
      details: `${venue} is already booked during this time range - choose a different venue.`,
    });
  }

  const previousVenue = event.venue;
  await event.update({ venue });
  const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
  const serialized = serializeEvent(withCreator);
  serialized.reassigned_from = previousVenue;
  return res.json(serialized);
}

// PATCH /events/:id/reassign-slot - Campus Manager only. Allocates an event
// to a different venue and/or date/time while preserving its approval state.
async function reassignSlot(req, res) {
  const { venue, event_date, start_time, end_time } = req.body;
  if (!venue || !event_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Validation failed', details: 'venue, event_date, start_time, and end_time are required.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
    return res.status(400).json({ error: 'Validation failed', details: 'event_date must be in YYYY-MM-DD format.' });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(start_time) || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(end_time)) {
    return res.status(400).json({ error: 'Validation failed', details: 'start_time and end_time must be valid times.' });
  }
  if (start_time >= end_time || start_time < '09:00' || end_time > '16:00') {
    return res.status(400).json({ error: 'Validation failed', details: 'Choose a slot between 9:00 AM and 4:00 PM.' });
  }
  if (hasStarted(event_date, start_time)) {
    return res.status(400).json({ error: 'Booking expired', details: 'Bookings cannot be moved to a date or time that has already passed.' });
  }

  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });

  const venueExists = await Venue.findOne({ where: { name: venue } });
  if (!venueExists) return res.status(400).json({ error: 'Validation failed', details: 'Selected venue is not recognized.' });

  const clashing = await findClashingEvent({ venue, event_date, start_time, end_time, excludeId: event.id });
  if (clashing) {
    return res.status(409).json({ error: 'Slot unavailable', details: `${venue} is already booked during this time range.` });
  }

  await event.update({ venue, event_date, start_time, end_time });
  const withCreator = await Event.findByPk(event.id, { include: { model: User, as: 'creator' } });
  return res.json(serializeEvent(withCreator));
}

// DELETE /events/:id - Campus Manager only. Permanently removes a booking,
// unlike cancel which just marks it inactive and keeps the record.
async function deleteEvent(req, res) {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found', details: 'Event does not exist.' });
  await event.destroy();
  return res.json({ deleted: true, id: Number(req.params.id) });
}

module.exports = {
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
};
