import React, { useMemo, useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons/Icons';

const WORKDAY_START = 9 * 60;
const WORKDAY_END = 16 * 60;
const WORKDAY_MINUTES = WORKDAY_END - WORKDAY_START;

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseMinutes(value) {
  if (!value) return 0;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(value) {
  if (!value) return '-';
  const [hours, minutes] = value.split(':');
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatMinutes(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const remainder = String(minutes % 60).padStart(2, '0');
  return formatTime(`${hours}:${remainder}`);
}

function formatMonth(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getOccupiedMinutes(events) {
  const ranges = events
    .map((event) => ({
      start: Math.max(WORKDAY_START, parseMinutes(event.start_time)),
      end: Math.min(WORKDAY_END, parseMinutes(event.end_time)),
    }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start);

  let occupied = 0;
  let current = null;
  ranges.forEach((range) => {
    if (!current) {
      current = range;
    } else if (range.start <= current.end) {
      current.end = Math.max(current.end, range.end);
    } else {
      occupied += current.end - current.start;
      current = range;
    }
  });
  if (current) occupied += current.end - current.start;
  return occupied;
}

function getAvailableRanges(events) {
  const ranges = events
    .map((event) => ({
      start: Math.max(WORKDAY_START, parseMinutes(event.start_time)),
      end: Math.min(WORKDAY_END, parseMinutes(event.end_time)),
    }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start);
  const available = [];
  let cursor = WORKDAY_START;
  ranges.forEach((range) => {
    if (range.start > cursor) available.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  });
  if (cursor < WORKDAY_END) available.push({ start: cursor, end: WORKDAY_END });
  return available;
}

function buildCalendarDays(month) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function BookingsCalendar({ bookings, venues, selectedVenue, onVenueChange, onClose }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const bookingsByDate = useMemo(() => {
    const grouped = {};
    bookings.forEach((booking) => {
      if (!grouped[booking.event_date]) grouped[booking.event_date] = [];
      grouped[booking.event_date].push(booking);
    });
    return grouped;
  }, [bookings]);

  const selectedBookings = bookingsByDate[selectedDate] || [];
  const bookingsByVenue = useMemo(() => {
    const grouped = {};
    const visibleVenues = selectedVenue ? venues.filter((venue) => venue.name === selectedVenue) : venues;
    visibleVenues.forEach((venue) => {
      grouped[venue.name] = [];
    });
    selectedBookings.forEach((booking) => {
      const venueName = booking.venue || 'Unassigned venue';
      if (!grouped[venueName]) grouped[venueName] = [];
      grouped[venueName].push(booking);
    });
    return grouped;
  }, [selectedBookings, selectedVenue, venues]);
  const days = buildCalendarDays(month);

  function changeMonth(offset) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="mb-6 bg-white rounded-xl border border-slate-100 shadow-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Booking Calendar</h2>
          <p className="text-xs text-slate-500 mt-0.5">Select a date to view its booked events.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
          aria-label="Close booking calendar"
          title="Close calendar"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="calendar-venue" className="text-xs font-semibold text-slate-500">Venue</label>
        <select
          id="calendar-venue"
          value={selectedVenue}
          onChange={(e) => onVenueChange(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Venues</option>
          {venues.map((venue) => (
            <option key={venue.id ?? venue.name} value={venue.name}>{venue.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center" aria-label="Previous month">
              <ChevronLeftIcon className="w-4 h-4 text-slate-600" />
            </button>
            <h3 className="text-sm font-bold text-slate-700">{formatMonth(month)}</h3>
            <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center" aria-label="Next month">
              <ChevronRightIcon className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-slate-400 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const dateKey = toDateKey(date);
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth = date.getMonth() === month.getMonth();
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === toDateKey(today);
              const dayOccupancy = Math.min(100, Math.round((getOccupiedMinutes(dayBookings) / WORKDAY_MINUTES) * 100));
              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`min-h-12 sm:min-h-14 rounded-lg border p-1 text-left transition ${
                    isSelected ? 'border-primary bg-primary text-white' : 'border-transparent hover:border-primary/30 hover:bg-primary-light/30'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <span className={`text-xs font-semibold ${isToday && !isSelected ? 'text-primary' : ''}`}>{date.getDate()}</span>
                  {dayBookings.length > 0 && (
                    <span className="mt-1 flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : dayOccupancy >= 75 ? 'bg-danger' : dayOccupancy >= 40 ? 'bg-warning' : 'bg-primary'}`} />
                      <span className="text-[10px] font-medium">{dayBookings.length}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-primary" /> Light</span>
            <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-warning" /> Moderate</span>
            <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-danger" /> High</span>
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected date</p>
              <h3 className="text-lg font-bold text-slate-800">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{selectedBookings.length}</p>
              <p className="text-[11px] text-slate-400">booked slots</p>
            </div>
          </div>
          {selectedBookings.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(bookingsByVenue).map(([venueName, venueBookings]) => {
                const venueOccupancy = Math.min(100, Math.round((getOccupiedMinutes(venueBookings) / WORKDAY_MINUTES) * 100));
                return (
                  <div key={venueName} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="font-semibold text-sm text-slate-700">{venueName}</div>
                      <span className={`text-xs font-bold ${venueOccupancy >= 75 ? 'text-danger' : venueOccupancy >= 40 ? 'text-warning' : 'text-primary'}`}>
                        {venueOccupancy}% booked
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${venueOccupancy >= 75 ? 'bg-danger' : venueOccupancy >= 40 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${venueOccupancy}%` }} />
                    </div>
                    <div className="space-y-1">
                      {venueBookings.map((booking) => (
                        <div key={booking.id} className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>{' '}
                          {booking.event_name}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 mb-1">Remaining slots</div>
                      <div className="text-xs text-slate-500">
                        {getAvailableRanges(venueBookings).length > 0
                          ? getAvailableRanges(venueBookings).map((range) => `${formatMinutes(range.start)} - ${formatMinutes(range.end)}`).join(', ')
                          : 'Fully booked from 9:00 AM to 4:00 PM'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">No bookings on this date.</div>
          )}
        </div>
      </div>
    </section>
  );
}
