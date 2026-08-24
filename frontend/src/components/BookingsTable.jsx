import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { designationLabel } from '../constants/roles';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

export default function BookingsTable({ bookings, loading, emptyMessage, onDelete }) {
  if (loading) {
    return <div className="text-slate-500 text-sm py-8 text-center">Loading bookings...</div>;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-slate-400 text-sm py-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
        {emptyMessage || 'No bookings found.'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-3 font-medium">Venue</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Time</th>
            <th className="text-left px-4 py-3 font-medium">Event</th>
            <th className="text-left px-4 py-3 font-medium">Requested By</th>
            <th className="text-left px-4 py-3 font-medium">Mobile</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-slate-700">{b.venue}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(b.event_date)}</td>
              <td className="px-4 py-3 text-slate-600">{formatTime(b.start_time)} - {formatTime(b.end_time)}</td>
              <td className="px-4 py-3 text-slate-700">{b.event_name}</td>
              <td className="px-4 py-3 text-slate-600">
                {b.creator?.name}
                <span className="text-slate-400"> ({designationLabel(b.creator?.designation)})</span>
              </td>
              <td className="px-4 py-3 text-slate-600">{b.creator?.contactno || '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link to={`/events/${b.id}`} className="text-primary text-xs font-medium hover:underline">
                    View
                  </Link>
                  {onDelete && (
                    <button onClick={() => onDelete(b)} className="text-danger text-xs font-medium hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
