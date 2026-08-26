import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import BookingsTable from '../components/BookingsTable';
import { SearchIcon } from '../components/icons/Icons';
import { listEvents } from '../services/eventService';

function eventEnd(event) {
  return new Date(`${event.event_date}T${event.end_time}`);
}

export default function PreviousBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listEvents();
        const now = new Date();
        const previous = data
          .filter((event) => eventEnd(event) < now)
          .sort((a, b) => eventEnd(b) - eventEnd(a));
        if (!cancelled) setBookings(previous);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBookings = query
    ? bookings.filter((booking) =>
        [
          booking.event_name,
          booking.venue,
          booking.organizer,
          booking.creator?.name,
          booking.creator?.department,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
    : bookings;

  function submitSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = searchInput.trim();
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next);
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-800">Previous Bookings</h1>
        <p className="text-sm text-slate-500">Venue bookings whose scheduled date and time have passed.</p>
      </div>

      <form onSubmit={submitSearch} className="mb-4 flex gap-1 sm:gap-2">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search previous bookings..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:py-2.5 sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded-lg px-2.5 py-2 sm:px-4 sm:py-2.5 transition"
        >
          Search
        </button>
      </form>

      {query && (
        <div className="text-xs text-slate-500 mb-4">
          Showing previous bookings for <span className="font-medium text-slate-700">&ldquo;{searchParams.get('q')}&rdquo;</span>
        </div>
      )}

      <BookingsTable
        bookings={filteredBookings}
        loading={loading}
        emptyMessage="No previous venue bookings found."
      />
    </AppLayout>
  );
}