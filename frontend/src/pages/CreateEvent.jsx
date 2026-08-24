import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import EventForm from '../components/EventForm';
import { useAuth } from '../context/AuthContext';
import { createEvent } from '../services/eventService';
import { designationLabel } from '../constants/roles';
import { LockIcon } from '../components/icons/Icons';

export default function CreateEvent() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVenue = searchParams.get('venue') || '';
  const onBehalfOfUserId = searchParams.get('user');
  const onBehalfOfUserName = searchParams.get('userName');
  const { user, isApOrHod } = useAuth();

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      const event = await createEvent(
        onBehalfOfUserId ? { ...payload, on_behalf_of_user_id: Number(onBehalfOfUserId) } : payload
      );
      navigate(`/events/${event.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isApOrHod) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <LockIcon className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">Booking not available for your role</h1>
          <p className="text-sm text-slate-500">
            Only <strong>AP</strong> and <strong>HODs</strong> can submit venue booking requests. Your account is
            registered as <strong>{user ? designationLabel(user.designation) : 'unknown'}</strong>,
            which reviews/approves bookings instead. Head to{' '}
            <Link to="/bookings" className="text-primary hover:underline">All Bookings</Link> to see and act on pending
            requests.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto">
        <h1 className="text-lg font-bold text-slate-800 mb-1">Book a Venue</h1>
        <p className="text-sm text-slate-500 mb-6">
          Choose a venue and time range. Existing overlapping bookings are checked before submission. Your request
          routes through HOD &rarr; Principal &rarr; Campus Manager for approval, and the booking is confirmed only
          once all three approve.
        </p>
        {onBehalfOfUserId && (
          <div className="bg-primary-light text-primary text-sm rounded-lg px-4 py-3 mb-4">
            Creating this booking on behalf of {onBehalfOfUserName || 'the selected user'}.
          </div>
        )}
        <EventForm onSubmit={handleSubmit} submitting={submitting} initialVenue={initialVenue} />
      </div>
    </AppLayout>
  );
}
