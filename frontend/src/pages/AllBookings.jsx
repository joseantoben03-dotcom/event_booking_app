import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import BookingsTable from '../components/BookingsTable';
import BookingsCalendar from '../components/BookingsCalendar';
import { listEvents, listVenues } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { CalendarIcon, SearchIcon } from '../components/icons/Icons';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending_hod', label: 'Pending HOD' },
  { value: 'pending_principal', label: 'Pending Principal' },
  { value: 'pending_campus_manager', label: 'Pending Campus Manager' },
  { value: 'fully_approved', label: 'Fully Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function eventEnd(event) {
  return new Date(`${event.event_date}T${event.end_time}`);
}

export default function AllBookings() {
  const { user, isHod } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const venue = searchParams.get('venue') || '';
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    listVenues()
      .then((data) => {
        if (!cancelled) setVenues(data);
      })
      .catch(() => {
        if (!cancelled) setVenues([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = {};
        if (status) params.status = status;
        if (venue) params.venue = venue;
        const data = await listEvents(params);
        if (!cancelled) setAllEvents(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status, venue]);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = allEvents.filter((event) => eventEnd(event) >= now);
    // HOD approvals are department-scoped, so when viewing "Pending HOD"
    // requests, only show the ones from their own department.
    if (status === 'pending_hod' && isHod && user) {
      list = list.filter((e) => e.creator?.department === user.department);
    }
    if (!q) return list;
    return list.filter((e) => {
      const searchableText = [
        e.event_name,
        e.venue,
        e.organizer,
        e.creator?.name,
        e.creator?.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchableText.includes(q);
    });
  }, [allEvents, q, status, isHod, user]);

  function submitSearch(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = searchInput.trim();
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next);
  }

  function setStatus(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next);
  }

  function setVenue(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('venue', value);
    else next.delete('venue');
    setSearchParams(next);
  }

  function clearSearch() {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  }

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">All Venue Bookings</h1>
          <p className="text-sm text-slate-500">Every booking request across campus, with live approval status.</p>
        </div>
        <button
          type="button"
          onClick={() => setCalendarOpen((open) => !open)}
          className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${calendarOpen ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/50'}`}
          aria-expanded={calendarOpen}
        >
          <CalendarIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Calendar</span>
        </button>
      </div>

      <form onSubmit={submitSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search event, venue, organizer, or department..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2.5 transition"
        >
          Search
        </button>
      </form>

      {q && (
        <div className="text-xs text-slate-500 mb-4">
          Showing results for <span className="font-medium text-slate-700">&ldquo;{searchParams.get('q')}&rdquo;</span>{' '}
          &mdash;{' '}
          <button onClick={clearSearch} className="text-primary hover:underline">
            clear search
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              status === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Filter by venue"
        >
          <option value="">All Venues</option>
          {venues.map((item) => (
            <option key={item.id ?? item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {calendarOpen && (
        <BookingsCalendar
          bookings={filtered}
          venues={venues}
          selectedVenue={venue}
          onVenueChange={setVenue}
          onClose={() => setCalendarOpen(false)}
        />
      )}

      <BookingsTable bookings={filtered} loading={loading} emptyMessage="No bookings match this filter." />
    </AppLayout>
  );
}
