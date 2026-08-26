import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import BookingsTable from '../components/BookingsTable';
import { useAuth } from '../context/AuthContext';
import { listVenues, createVenue, deleteVenue, listEvents, deleteEvent } from '../services/eventService';
import { listUsers } from '../services/userService';
import { ShieldIcon, PlusIcon, XIcon } from '../components/icons/Icons';

export default function Admin() {
  const { isCampusManager } = useAuth();
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [newVenueName, setNewVenueName] = useState('');
  const [venueError, setVenueError] = useState('');
  const [savingVenue, setSavingVenue] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userBookingsLoading, setUserBookingsLoading] = useState(false);
  const [userError, setUserError] = useState('');

  const loadVenues = useCallback(async () => {
    setVenuesLoading(true);
    try {
      const data = await listVenues();
      setVenues(data);
    } finally {
      setVenuesLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await listEvents();
      setEvents(data);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCampusManager) {
      loadVenues();
      loadEvents();
    }
  }, [isCampusManager, loadVenues, loadEvents]);

  async function handleAddVenue(e) {
    e.preventDefault();
    setVenueError('');
    if (!newVenueName.trim()) {
      setVenueError('Enter a venue name.');
      return;
    }
    setSavingVenue(true);
    try {
      await createVenue(newVenueName.trim());
      setNewVenueName('');
      await loadVenues();
    } catch (err) {
      setVenueError(err?.response?.data?.details || err?.response?.data?.error || 'Failed to add venue.');
    } finally {
      setSavingVenue(false);
    }
  }

  async function handleDeleteVenue(id) {
    setPendingAction({ type: 'venue', id });
  }

  async function confirmDelete() {
    if (!pendingAction) return;
    setVenueError('');
    try {
      if (pendingAction.type === 'venue') {
        await deleteVenue(pendingAction.id);
        await loadVenues();
        setSuccessMessage('Venue deleted successfully.');
      } else {
        await deleteEvent(pendingAction.booking.id);
        setUserBookings((current) => current.filter((item) => item.id !== pendingAction.booking.id));
        setEvents((current) => current.filter((item) => item.id !== pendingAction.booking.id));
        setSuccessMessage('Booking deleted successfully.');
      }
      setPendingAction(null);
    } catch (err) {
      if (pendingAction.type === 'venue') {
        setVenueError(err?.response?.data?.details || err?.response?.data?.error || 'Failed to delete venue.');
      } else {
        setUserError(err?.response?.data?.details || 'Unable to delete booking.');
      }
    }
  }

  async function handleUserSearch(e) {
    e.preventDefault();
    const search = userSearch.trim();
    setUserLoading(true);
    setUserError('');
    setUserResults([]);
    setSelectedUser(null);
    setUserBookings([]);
    try {
      setUserResults(await listUsers(search));
      setUserSearch('');
    } catch (err) {
      setUserError(err?.response?.data?.details || 'Unable to search users.');
    } finally {
      setUserLoading(false);
    }
  }

  async function selectUser(user) {
    setSelectedUser(user);
    setUserBookingsLoading(true);
    setUserError('');
    try {
      setUserBookings(await listEvents({ creator: user.id }));
    } catch (err) {
      setUserError(err?.response?.data?.details || 'Unable to load this user\'s bookings.');
    } finally {
      setUserBookingsLoading(false);
    }
  }

  async function handleDeleteBooking(booking) {
    setPendingAction({ type: 'booking', booking });
  }

  if (!isCampusManager) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ShieldIcon className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">Campus Manager access required</h1>
          <p className="text-sm text-slate-500">This page is only available to Campus Manager accounts.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-light text-white flex items-center justify-center">
          <ShieldIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Campus Manager</h1>
          <p className="text-sm text-slate-500">Manage venues, approvals, bookings, and venue reassignment.</p>
        </div>
      </div>

      {/* Venue management */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Manage Venues</h2>
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
          <form onSubmit={handleAddVenue} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              placeholder="New venue name, e.g. Seminar Hall"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={savingVenue}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition disabled:opacity-60"
            >
              <PlusIcon className="w-4 h-4" />
              Add Venue
            </button>
          </form>

          {venueError && (
            <div className="bg-danger-light text-danger text-sm rounded-lg px-4 py-2 mb-4">{venueError}</div>
          )}

          {venuesLoading ? (
            <div className="text-sm text-slate-400">Loading venues...</div>
          ) : venues.length === 0 ? (
            <div className="text-sm text-slate-400">No venues yet - add one above.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {venues.map((v) => (
                <span
                  key={v.id}
                  className="inline-flex items-center gap-2 bg-surface border border-slate-200 rounded-full pl-3 pr-1.5 py-1.5 text-sm text-slate-700"
                >
                  {v.name}
                  <button
                    onClick={() => handleDeleteVenue(v.id)}
                    className="w-5 h-5 rounded-full hover:bg-danger-light hover:text-danger flex items-center justify-center transition"
                    title="Delete venue"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All bookings with direct-approval access via each row's detail page */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Manage A User</h2>
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5 mb-8">
          <form onSubmit={handleUserSearch} className="flex flex-col sm:flex-row gap-3">
            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name, email, or department..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button type="submit" disabled={userLoading} className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60">
              {userLoading ? 'Searching...' : 'Find User'}
            </button>
          </form>
          {userError && <div className="bg-danger-light text-danger text-sm rounded-lg px-4 py-2 mt-4">{userError}</div>}
          {userResults.length > 0 && (
            <div className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {userResults.map((user) => (
                <button key={user.id} onClick={() => selectUser(user)} className="w-full text-left px-3 py-3 hover:bg-surface transition">
                  <span className="block text-sm font-medium text-slate-700">{user.name}</span>
                  <span className="block text-xs text-slate-500">{user.email} - {user.department} - {user.designation}</span>
                </button>
              ))}
            </div>
          )}
          {selectedUser && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">{selectedUser.name}'s Bookings</h3>
                  <p className="text-xs text-slate-500">{selectedUser.email} - {selectedUser.department}</p>
                </div>
                <Link to={`/events/new?user=${selectedUser.id}&userName=${encodeURIComponent(selectedUser.name)}`} className="text-sm font-medium text-primary hover:underline">
                  Book on behalf
                </Link>
              </div>
              <BookingsTable
                bookings={userBookings}
                loading={userBookingsLoading}
                emptyMessage="This user has no bookings."
                onDelete={handleDeleteBooking}
              />
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">All Bookings</h2>
        <p className="text-xs text-slate-400 mb-3">
          Open any booking to approve, reject, or override any step directly - regardless of sequence or department.
          Campus Managers can permanently delete any booking, including active or fully booked slots.
        </p>
        <BookingsTable
          bookings={events}
          loading={eventsLoading}
          emptyMessage="No bookings yet."
          onDelete={handleDeleteBooking}
        />
      </section>

      {successMessage && (
        <div className="fixed bottom-5 right-5 z-40 bg-success text-white rounded-lg shadow-lg px-4 py-3 text-sm font-medium">
          {successMessage}
          <button type="button" onClick={() => setSuccessMessage('')} className="ml-3 text-white/80 hover:text-white" aria-label="Dismiss success message">&times;</button>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-30 bg-slate-900/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-800">Confirm deletion</h2>
            <p className="text-sm text-slate-500 mt-2">
              {pendingAction.type === 'venue'
                ? 'Delete this venue? It will no longer be offered for new bookings.'
                : `Permanently delete "${pendingAction.booking.event_name}"?`}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setPendingAction(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Keep it
              </button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
