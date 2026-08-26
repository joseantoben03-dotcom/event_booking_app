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

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventCard({ event, onApprove, onReject, actionDisabled, detailsLabel = 'View details' }) {
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
        <div className="col-span-2">
          <div className="text-slate-400 text-xs">Request submitted</div>
          <div className="text-slate-700 font-medium">{formatDateTime(event.created_at)}</div>
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

      <div className="border-t border-slate-100 pt-3 text-xs">
        <div className="font-semibold uppercase tracking-wide text-slate-400 mb-2">Approval history</div>
        <div className="space-y-1.5 text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <span>HOD</span>
            <span className="text-right text-slate-600">{event.hod_approved} - {formatDateTime(event.hod_approved_at)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Principal</span>
            <span className="text-right text-slate-600">{event.principal_approved} - {formatDateTime(event.principal_approved_at)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Campus Manager</span>
            <span className="text-right text-slate-600">{event.campus_manager_approved} - {formatDateTime(event.campus_manager_approved_at)}</span>
          </div>
        </div>
      </div>

      <Link
        to={`/events/${event.id}`}
        className="mt-1 text-primary text-sm font-medium hover:underline self-start"
      >
        {detailsLabel} &rarr;
      </Link>

      {(onApprove || onReject) && (
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          {onApprove && (
            <button
              type="button"
              disabled={actionDisabled}
              onClick={onApprove}
              className="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {onReject && (
            <button
              type="button"
              disabled={actionDisabled}
              onClick={onReject}
              className="flex-1 rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
