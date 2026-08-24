import React, { useState, useEffect, useCallback } from 'react';
import { withVenueStyle } from '../constants/venueStyles';
import VenueCard from './VenueCard';
import { listEvents, listVenues } from '../services/eventService';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = Number(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

const TIME_OPTIONS = Array.from({ length: 41 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

function buildForm(initialVenue, initialData) {
  if (initialData) {
    return {
      event_name: initialData.event_name || '',
      venue: initialData.venue || '',
      purpose: initialData.purpose || '',
      organizer: initialData.organizer || '',
      no_of_participants: initialData.no_of_participants || '',
      event_date: initialData.event_date || todayISO(),
      start_time: initialData.start_time?.slice(0, 5) || '',
      end_time: initialData.end_time?.slice(0, 5) || '',
    };
  }
  return {
    event_name: '',
    venue: initialVenue || '',
    purpose: '',
    organizer: '',
    no_of_participants: '',
    event_date: todayISO(),
    start_time: '',
    end_time: '',
  };
}

export default function EventForm({ onSubmit, submitting, initialVenue, initialData, submitLabel }) {
  const isEditing = !!initialData;
  const [form, setForm] = useState(() => buildForm(initialVenue, initialData));
  const [error, setError] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadVenues() {
      setVenuesLoading(true);
      try {
        const data = await listVenues();
        if (!cancelled) setVenues(data.map(withVenueStyle));
      } catch {
        if (!cancelled) setVenues([]);
      } finally {
        if (!cancelled) setVenuesLoading(false);
      }
    }
    loadVenues();
    return () => {
      cancelled = true;
    };
  }, []);

  // Whenever venue or date changes, refetch that day's bookings for the venue
  // (excluding this event itself when editing, so its own slot doesn't
  // appear as "booked").
  const loadBookedSlots = useCallback(async () => {
    if (!form.venue || !form.event_date) {
      setBookedRanges([]);
      return;
    }
    setCheckingSlots(true);
    try {
      const events = await listEvents({ venue: form.venue, event_date: form.event_date });
      setBookedRanges(
        events
          .filter((e) => !e.status.startsWith('Rejected') && e.status !== 'Cancelled')
          .filter((e) => !isEditing || e.id !== initialData.id)
          .map((e) => ({ start: e.start_time?.slice(0, 5), end: e.end_time?.slice(0, 5) }))
          .filter((range) => range.start && range.end)
      );
    } catch {
      setBookedRanges([]);
    } finally {
      setCheckingSlots(false);
    }
  }, [form.venue, form.event_date, isEditing, initialData]);

  useEffect(() => {
    loadBookedSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.venue, form.event_date]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleVenueSelect(name) {
    setForm((f) => ({ ...f, venue: name, start_time: '', end_time: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (
      !form.event_name ||
      !form.venue ||
      !form.purpose ||
      !form.organizer ||
      !form.no_of_participants ||
      !form.event_date ||
      !form.start_time ||
      !form.end_time
    ) {
      setError('All fields are required, including venue, date, start time and end time.');
      return;
    }
    if (form.start_time >= form.end_time) {
      setError('End time must be later than start time.');
      return;
    }
    if (bookedRanges.some((range) => range.start < form.end_time && range.end > form.start_time)) {
      setError('This venue is already booked during the selected time range.');
      return;
    }
    if (Number(form.no_of_participants) <= 0) {
      setError('Number of participants must be greater than 0.');
      return;
    }

    try {
      await onSubmit({ ...form, no_of_participants: Number(form.no_of_participants) });
      if (!isEditing) setForm(buildForm());
    } catch (err) {
      const details = err?.response?.data?.details;
      const msg = Array.isArray(details) ? details[0]?.msg : details;
      setError(msg || err?.response?.data?.error || 'Failed to save booking.');
      // A 409 slot conflict means someone else grabbed it just now - refresh the grid.
      if (err?.response?.status === 409) loadBookedSlots();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card border border-slate-100 p-6 space-y-4">
      {error && (
        <div className="bg-danger-light text-danger text-sm rounded-lg px-4 py-2">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Event Name</label>
        <input
          name="event_name"
          value={form.event_name}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="e.g. Tech Symposium 2026"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Select Venue</label>
        {venuesLoading ? (
          <div className="text-sm text-slate-400 bg-surface rounded-lg px-3 py-2">Loading venues...</div>
        ) : venues.length === 0 ? (
          <div className="text-sm text-slate-400 bg-surface rounded-lg px-3 py-2">
            No venues are available right now. Contact the ERP administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {venues.map((v) => (
              <VenueCard key={v.id ?? v.name} venue={v} selected={form.venue === v.name} onSelect={handleVenueSelect} />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
        <input
          type="date"
          name="event_date"
          min={todayISO()}
          value={form.event_date}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Exact Time Range
          {form.venue && <span className="text-slate-400 font-normal"> &mdash; {form.venue}</span>}
        </label>
        {form.venue ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] gap-4 items-start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Start time</label>
                  <select name="start_time" value={form.start_time} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Select start time</option>
                    {TIME_OPTIONS.slice(0, -1).map((time) => {
                      const isBooked = bookedRanges.some((range) => time >= range.start && time < range.end);
                      return <option key={time} value={time} disabled={isBooked}>{formatTime(time)}{isBooked ? ' - Booked' : ''}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">End time</label>
                  <select name="end_time" value={form.end_time} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">Select end time</option>
                    {TIME_OPTIONS.slice(1).map((time) => {
                      const isInvalid = form.start_time && time <= form.start_time;
                      const isBooked = form.start_time
                        ? bookedRanges.some((range) => range.start < time && range.end > form.start_time)
                        : bookedRanges.some((range) => time > range.start && time <= range.end);
                      return <option key={time} value={time} disabled={isBooked || isInvalid}>{formatTime(time)}{isBooked ? ' - Booked' : ''}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 min-h-[96px]">
                <div className="text-sm font-semibold text-slate-700 mb-2">Booked time slots</div>
                {checkingSlots ? (
                  <div className="text-sm text-slate-400">Checking availability...</div>
                ) : bookedRanges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                  {bookedRanges.map((range) => (
                    <span key={`${range.start}-${range.end}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {formatTime(range.start)} - {formatTime(range.end)}
                      <span className="font-semibold text-slate-500">Booked</span>
                    </span>
                  ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No bookings for this date.</div>
                )}
              </div>
            </div>
            {bookedRanges.some((range) => range.start < form.end_time && range.end > form.start_time) && (
              <div className="text-xs text-danger mt-2">Selected time overlaps an unavailable range.</div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400 bg-surface rounded-lg px-3 py-2">
            Select a venue above to see available time slots.
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Organizer</label>
        <input
          name="organizer"
          value={form.organizer}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="e.g. CSE Association"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Purpose</label>
        <textarea
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Describe the purpose of the event"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">No. of Participants</label>
        <input
          type="number"
          min="1"
          name="no_of_participants"
          value={form.no_of_participants}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="e.g. 250"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-medium rounded-lg py-2.5 transition disabled:opacity-60"
      >
        {submitting ? 'Saving...' : submitLabel || 'Submit for Approval'}
      </button>
    </form>
  );
}
