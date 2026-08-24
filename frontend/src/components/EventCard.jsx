import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { designationLabel } from '../constants/roles';

function formatTime(time) {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 leading-tight">{event.event_name}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{event.venue}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-400 text-xs">Date</div>
          <div className="text-slate-700 font-medium">{event.event_date}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Time</div>
          <div className="text-slate-700 font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Organizer</div>
          <div className="text-slate-700 font-medium">{event.organizer}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Participants</div>
          <div className="text-slate-700 font-medium">{event.no_of_participants}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Created by</div>
          <div className="text-slate-700 font-medium">{event.creator?.name}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Department</div>
          <div className="text-slate-700 font-medium">{event.creator?.department}</div>
        </div>
        <div className="col-span-2">
          <div className="text-slate-400 text-xs">{designationLabel(event.creator?.designation)} Mobile</div>
          <div className="text-slate-700 font-medium">{event.creator?.contactno || 'Not provided'}</div>
        </div>
      </div>

      <Link
        to={`/events/${event.id}`}
        className="mt-1 text-primary text-sm font-medium hover:underline self-start"
      >
        View details &rarr;
      </Link>
    </div>
  );
}
