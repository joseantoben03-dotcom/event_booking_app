import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import EventForm from '../components/EventForm';
import { useAuth } from '../context/AuthContext';
import { getEvent, updateEvent } from '../services/eventService';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getEvent(id);
        if (!cancelled) setEvent(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      const updated = await updateEvent(id, payload);
      navigate(`/events/${updated.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-slate-500">Loading booking...</div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-slate-500">Booking not found.</div>
      </AppLayout>
    );
  }

  if (!user || event.user_id !== user.id) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-6 text-center">
          <h1 className="text-lg font-bold text-slate-800 mb-1">You can't edit this booking</h1>
          <p className="text-sm text-slate-500">Only the person who requested this booking can edit it.</p>
        </div>
      </AppLayout>
    );
  }

  if (!event.is_editable) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card border border-slate-100 p-6 text-center">
          <h1 className="text-lg font-bold text-slate-800 mb-1">This booking can no longer be edited</h1>
          <p className="text-sm text-slate-500 mb-4">
            Editing is only possible before any approval step has been actioned. Current status:{' '}
            <strong>{event.status}</strong>.
          </p>
          <Link to={`/events/${id}`} className="text-primary text-sm font-medium hover:underline">
            &larr; Back to booking details
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <Link to={`/events/${id}`} className="text-sm text-primary hover:underline">&larr; Back to booking details</Link>
        <h1 className="text-lg font-bold text-slate-800 mt-3 mb-1">Edit Booking</h1>
        <p className="text-sm text-slate-500 mb-6">
          You can change any detail while your request is still fully pending. Once an approver acts on it, edits
          are locked.
        </p>
        <EventForm onSubmit={handleSubmit} submitting={submitting} initialData={event} submitLabel="Save Changes" />
      </div>
    </AppLayout>
  );
}
