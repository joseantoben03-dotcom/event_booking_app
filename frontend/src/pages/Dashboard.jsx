import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { listEvents, listVenues } from '../services/eventService';
import { withVenueStyle } from '../constants/venueStyles';
import { COLOR_STYLES } from '../constants/colors';
import { TicketIcon, ClipboardListIcon, ClockIcon, CheckCircleIcon } from '../components/icons/Icons';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function eventHasEnded(event) {
  return new Date(`${event.event_date}T${event.end_time}`) < new Date();
}

export default function Dashboard() {
  const { user, isApOrHod, isHod, isPrincipal, isCampusManager } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await listEvents();
        if (!cancelled) setEvents(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const myBookingsCount = useMemo(
    () => events.filter((e) => user && e.user_id === user.id).length,
    [events, user]
  );

  const currentBookingsCount = useMemo(
    () => events.filter((event) => !eventHasEnded(event)).length,
    [events]
  );

  // For HOD, approval requests are scoped to their own department - AP/HOD
  // requests only ever need sign-off from the HOD of the same department.
  const pendingMyActionEvents = useMemo(() => {
    if (isHod)
      return events.filter(
        (e) => e.hod_approved === 'pending' && !e.is_cancelled && e.creator?.department === user?.department
      );
    if (isPrincipal)
      return events.filter((e) => e.hod_approved === 'approved' && e.principal_approved === 'pending' && !e.is_cancelled);
    if (isCampusManager)
      return events.filter(
        (e) =>
          e.hod_approved === 'approved' &&
          e.principal_approved === 'approved' &&
          e.campus_manager_approved === 'pending' &&
          !e.is_cancelled
      );
    return [];
  }, [events, isHod, isPrincipal, isCampusManager, user]);

  const pendingMyActionCount = pendingMyActionEvents.length;

  const pendingStatus = isHod
    ? 'pending_hod'
    : isPrincipal
    ? 'pending_principal'
    : isCampusManager
    ? 'pending_campus_manager'
    : '';

  const bookingCountByVenue = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      if (e.status === 'Fully approved') counts[e.venue] = (counts[e.venue] || 0) + 1;
    });
    return counts;
  }, [events]);

  const todaysBookings = useMemo(
    () => events.filter((e) => e.event_date === todayISO() && !e.is_cancelled && !e.status.startsWith('Rejected')),
    [events]
  );

  return (
    <AppLayout>
      {/* Venue overview cards */}
      <h2 className="text-sm font-bold text-slate-700 mb-3">Venues</h2>
      {venuesLoading ? (
        <div className="text-sm text-slate-400 mb-8">Loading venues...</div>
      ) : venues.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400 text-center mb-8">
          No venues configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {venues.map((v) => {
            const style = COLOR_STYLES[v.color] || COLOR_STYLES.indigo;
            const href = isApOrHod
              ? `/events/new?venue=${encodeURIComponent(v.name)}`
              : `/bookings?q=${encodeURIComponent(v.name)}`;
            return (
              <Link
                key={v.id ?? v.name}
                to={href}
                className="bg-white rounded-xl border border-slate-100 shadow-card p-4 hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                title={isApOrHod ? `Book ${v.name}` : `View bookings for ${v.name}`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <div className="text-sm font-semibold text-slate-800 mt-2">{v.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {bookingCountByVenue[v.name] || 0} confirmed booking{bookingCountByVenue[v.name] === 1 ? '' : 's'}
                </div>
                <div className="text-[11px] text-primary font-medium mt-2">
                  {isApOrHod ? 'Book this venue \u2192' : 'View bookings \u2192'}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <Link
          to="/my-bookings"
          className="bg-white rounded-xl border border-slate-100 shadow-card p-5 hover:border-primary/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">My Bookings</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COLOR_STYLES.indigo.bg} ${COLOR_STYLES.indigo.text}`}>
              <TicketIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{loading ? '-' : myBookingsCount}</div>
          <div className="text-xs text-primary font-medium mt-2">View all &rarr;</div>
        </Link>

        <Link
          to="/bookings"
          className="bg-white rounded-xl border border-slate-100 shadow-card p-5 hover:border-primary/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Venue Bookings</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COLOR_STYLES.blue.bg} text-white`}>
              <ClipboardListIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{loading ? '-' : currentBookingsCount}</div>
          <div className="text-xs text-primary font-medium mt-2">View all &rarr;</div>
        </Link>

        {pendingMyActionCount > 0 ? (
          <Link
            to={pendingStatus ? `/bookings?status=${pendingStatus}` : '/bookings'}
            className="bg-white rounded-xl border border-amber-100 shadow-card p-5 hover:shadow-md transition sm:col-span-2 xl:col-span-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Awaiting Your Approval</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COLOR_STYLES.amber.bg} ${COLOR_STYLES.amber.text}`}>
                <ClockIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-warning">{loading ? '-' : pendingMyActionCount}</div>
            <div className="text-xs text-primary font-medium mt-2">Review now &rarr;</div>
          </Link>
        ) : (
          <Link
            to="/bookings?status=fully_approved"
            className="bg-white rounded-xl border border-slate-100 shadow-card p-5 sm:col-span-2 xl:col-span-1 hover:border-primary/50 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Fully Approved</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COLOR_STYLES.emerald.bg} ${COLOR_STYLES.emerald.text}`}>
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {loading ? '-' : events.filter((e) => e.status === 'Fully approved').length}
            </div>
          </Link>
        )}
      </div>

      {(isHod || isPrincipal || isCampusManager) && (
        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-bold text-slate-700">
              Requests Awaiting Your Approval
              {isHod && user?.department && <span className="text-slate-400 font-normal"> &mdash; {user.department}</span>}
            </h2>
            <Link to={`/bookings?status=${pendingStatus}`} className="text-xs text-primary font-medium hover:underline">
              View all &rarr;
            </Link>
          </div>
          {pendingMyActionEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingMyActionEvents.slice(0, 6).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400 text-center">
              No requests are waiting for your approval.
            </div>
          )}
        </section>
      )}

      {/* Today's bookings - visible to everyone */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Today&apos;s Bookings</h2>
        {loading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : todaysBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {todaysBookings.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400 text-center">
            No venues are booked for today.
          </div>
        )}
      </section>

    </AppLayout>
  );
}
