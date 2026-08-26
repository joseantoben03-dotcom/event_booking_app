import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import BookingsTable from '../components/BookingsTable';
import { SearchIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import { listEvents } from '../services/eventService';

export default function MyBookings() {
  const { user, isApOrHod } = useAuth();
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
        const data = await listEvents({ creator: user?.id });
        if (!cancelled) setBookings(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (user) load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const previousBookings = bookings
    .filter((booking) => new Date(`${booking.event_date}T${booking.end_time}`) < new Date())
    .sort(
      (a, b) =>
        new Date(`${b.event_date}T${b.end_time}`) - new Date(`${a.event_date}T${a.end_time}`)
    );
  const currentBookings = bookings.filter((booking) => !previousBookings.includes(booking));
  const matchesQuery = (booking) => {
    if (!query) return true;
    return [
      booking.event_name,
      booking.venue,
      booking.organizer,
      booking.creator?.name,
      booking.creator?.department,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  };
  const filteredPreviousBookings = previousBookings.filter(matchesQuery);
  const filteredCurrentBookings = currentBookings.filter(matchesQuery);

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
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">My Bookings</h1>
          <p className="text-sm text-slate-500">Venue requests you've submitted, and their current approval status.</p>
        </div>
        {isApOrHod && (
          <Link
            to="/events/new"
            className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2.5 transition shrink-0"
          >
            + Book a Venue
          </Link>
        )}
      </div>

      <form onSubmit={submitSearch} className="mb-6 flex gap-1 sm:gap-2">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search my bookings..."
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

      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Current Bookings</h2>
        <BookingsTable
          bookings={filteredCurrentBookings}
          loading={loading}
          emptyMessage="You don't have any current bookings."
        />
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Previous Bookings</h2>
        <BookingsTable
          bookings={filteredPreviousBookings}
          loading={loading}
          emptyMessage="You don't have any previous bookings."
        />
      </section>
    </AppLayout>
  );
}
