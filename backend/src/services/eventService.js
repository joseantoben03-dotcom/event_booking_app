// Turns the three approval enums (plus cancellation) into a single
// human-readable status string.
function hasEnded(event) {
  if (!event.event_date || !event.end_time) return false;
  return new Date(`${event.event_date}T${event.end_time}`) <= new Date();
}

function computeStatus(event) {
  const { hod_approved, principal_approved, campus_manager_approved, is_cancelled } = event;

  if (is_cancelled) return 'Cancelled';
  if (hasEnded(event)) return 'Expired';

  if (hod_approved === 'rejected') return 'Rejected by HOD';
  if (principal_approved === 'rejected') return 'Rejected by Principal';
  if (campus_manager_approved === 'rejected') return 'Rejected by Campus Manager';

  if (hod_approved !== 'approved') return 'Pending HOD approval';
  if (principal_approved !== 'approved') return 'Approved by HOD, pending Principal approval';
  if (campus_manager_approved !== 'approved') return 'Approved by HOD and Principal, pending Campus Manager approval';

  return 'Fully approved';
}

// A slot is free to be re-booked once its request has been rejected or
// cancelled; anything else (pending or approved) still blocks the slot.
function isSlotFree(status) {
  return status === 'Cancelled' || status === 'Expired' || status.startsWith('Rejected');
}

// True only while none of the three approval steps have moved off
// 'pending' - this is the window during which the creator may still edit
// the booking themselves.
function isFullyPending(event) {
  return event.hod_approved === 'pending' && event.principal_approved === 'pending' && event.campus_manager_approved === 'pending';
}

function serializeEvent(eventInstance) {
  const e = eventInstance.toJSON ? eventInstance.toJSON() : eventInstance;
  const status = computeStatus(e);
  return {
    id: e.id,
    user_id: e.user_id,
    venue: e.venue,
    event_name: e.event_name,
    purpose: e.purpose,
    organizer: e.organizer,
    no_of_participants: e.no_of_participants,
    event_date: e.event_date,
    start_time: e.start_time,
    end_time: e.end_time,
    hod_approved: e.hod_approved,
    principal_approved: e.principal_approved,
    campus_manager_approved: e.campus_manager_approved,
    is_cancelled: !!e.is_cancelled,
    status,
    is_booked: status === 'Fully approved',
    is_editable: isFullyPending(e) && !e.is_cancelled,
    creator: e.creator
      ? {
          id: e.creator.id,
          name: e.creator.name,
          email: e.creator.email,
          contactno: e.creator.contactno,
          designation: e.creator.designation,
          department: e.creator.department,
        }
      : undefined,
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
}

module.exports = { computeStatus, isSlotFree, isFullyPending, serializeEvent };
