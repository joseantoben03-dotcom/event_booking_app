-- Track when each booking lifecycle status was actioned.
ALTER TABLE events
  ADD COLUMN hod_approved_at TIMESTAMP NULL AFTER hod_approved,
  ADD COLUMN principal_approved_at TIMESTAMP NULL AFTER principal_approved,
  ADD COLUMN campus_manager_approved_at TIMESTAMP NULL AFTER campus_manager_approved,
  ADD COLUMN cancelled_at TIMESTAMP NULL AFTER is_cancelled;