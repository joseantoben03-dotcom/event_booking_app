import React from 'react';
import EventCard from './EventCard';

export default function EventList({ events, loading, emptyMessage }) {
  if (loading) {
    return <div className="text-slate-500 text-sm py-8 text-center">Loading events...</div>;
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
        {emptyMessage || 'No events found.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
