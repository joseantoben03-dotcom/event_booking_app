import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getEvent, approveHod, approvePrincipal, approveCampusManager, cancelEvent } from '../services/eventService';
import { designationLabel } from '../constants/roles';
import { CheckIcon, XIcon, ClockIcon, CheckCircleIcon } from '../components/icons/Icons';

const APPROVAL_STEPS = [
  { key: 'hod_approved', label: 'HOD' },
  { key: 'principal_approved', label: 'Principal' },
  { key: 'campus_manager_approved', label: 'Campus Manager' },
];

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

function StepPill({ label, value }) {
  const styles = {
    approved: 'bg-success-light text-success',
    rejected: 'bg-danger-light text-danger',
    pending: 'bg-slate-100 text-slate-500',
  };
  const StepIcon = value === 'approved' ? CheckIcon : value === 'rejected' ? XIcon : ClockIcon;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${styles[value]}`}>
        <StepIcon className="w-4 h-4" strokeWidth="2.5" />
      </div>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isHod, isPrincipal, isCampusManager, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [cancelPrompt, setCancelPrompt] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEvent(id);
      setEvent(data);
    } catch (err) {
      setError('Unable to load event.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(fn, status) {
    setActing(true);
    setError('');
    try {
      const updated = await fn(id, status);
      setEvent(updated);
    } catch (err) {
      setError(err?.response?.data?.details || err?.response?.data?.error || 'Action failed.');
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    setCancelPrompt(true);
  }

  async function confirmCancel() {
    setCancelPrompt(false);
    setActing(true);
    setError('');
    try {
      const updated = await cancelEvent(id);
      setEvent(updated);
    } catch (err) {
      setError(err?.response?.data?.details || err?.response?.data?.error || 'Unable to cancel this booking.');
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-slate-500">Loading event...</div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-slate-500">Event not found.</div>
      </AppLayout>
    );
  }

  const isOwner = !!user && event.user_id === user.id;
  // Normal roles can only act on their own step, in sequence, within their
  // department. Admins can override any of the three steps directly, at
  // any time, regardless of sequence or department.
  const canApproveHod = isAdmin || (isHod && event.hod_approved === 'pending' && event.creator?.department === user?.department);
  const canApprovePrincipal =
    isAdmin || (isPrincipal && event.hod_approved === 'approved' && event.principal_approved === 'pending');
  const canApproveCampusManager =
    isAdmin ||
    (isCampusManager &&
      event.hod_approved === 'approved' &&
      event.principal_approved === 'approved' &&
      event.campus_manager_approved === 'pending');

  const scheduledStart = new Date(`${event.event_date}T${event.start_time}`);
  const hasNotHappenedYet = scheduledStart > new Date();
  const canCancel = isOwner && event.status !== 'Cancelled' && !event.status.startsWith('Rejected') && hasNotHappenedYet;
  const canEdit = isOwner && event.is_editable;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-sm text-primary hover:underline">&larr; Back to dashboard</Link>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mt-4">
          {event.status === 'Fully approved' && (
            <div className="bg-success-light text-success text-sm font-medium rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 shrink-0" />
              Successfully booked! {event.venue} is confirmed for {formatDate(event.event_date)} from {formatTime(event.start_time)} to {formatTime(event.end_time)}.
            </div>
          )}
          {event.status === 'Cancelled' && (
            <div className="bg-slate-100 text-slate-600 text-sm font-medium rounded-lg px-4 py-3 mb-5">
              This booking was cancelled. The slot is available for others to book.
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{event.event_name}</h1>
              <p className="text-sm text-slate-500 mt-1">{event.venue}</p>
            </div>
            <StatusBadge status={event.status} />
          </div>

          <div className="flex items-center justify-between max-w-sm mx-auto my-6">
            {APPROVAL_STEPS.map((s) => (
              <StepPill key={s.key} label={s.label} value={event[s.key]} />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-5">
            <div>
              <div className="text-slate-400 text-xs">Date</div>
              <div className="text-slate-700 font-medium">{formatDate(event.event_date)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Time Slot</div>
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
              <div className="text-slate-700 font-medium">
                {event.creator?.name} ({designationLabel(event.creator?.designation)})
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Department</div>
              <div className="text-slate-700 font-medium">{event.creator?.department}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">{designationLabel(event.creator?.designation)} Mobile</div>
              <div className="text-slate-700 font-medium">{event.creator?.contactno || 'Not provided'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-slate-400 text-xs">Purpose</div>
              <div className="text-slate-700">{event.purpose}</div>
            </div>
          </div>

          {error && (
            <div className="bg-danger-light text-danger text-sm rounded-lg px-4 py-2 mt-5">{error}</div>
          )}

          {isOwner && (canEdit || canCancel) && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6 border-t border-slate-100 pt-5">
              {canEdit && (
                <button
                  onClick={() => navigate(`/events/${id}/edit`)}
                  className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-primary-dark transition"
                >
                  Edit Booking
                </button>
              )}
              {canCancel && (
                <button
                  disabled={acting}
                  onClick={handleCancel}
                  className="flex-1 bg-white border border-danger text-danger text-sm font-medium rounded-lg py-2.5 hover:bg-danger-light transition disabled:opacity-60"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )}

            {cancelPrompt && (
              <div className="fixed inset-0 z-30 bg-slate-900/30 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-5">
                  <h2 className="text-base font-bold text-slate-800">Confirm cancellation</h2>
                  <p className="text-sm text-slate-500 mt-2">Cancel this booking? The slot will become available for others to book.</p>
                  <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={() => setCancelPrompt(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                      Keep booking
                    </button>
                    <button type="button" onClick={confirmCancel} className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90">
                      Cancel booking
                    </button>
                  </div>
                </div>
              </div>
            )}

          {(canApproveHod || canApprovePrincipal || canApproveCampusManager) && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              {isAdmin && (
                <p className="text-xs text-slate-400 mb-3">
                  Admin override: you can set any approval step directly, regardless of sequence or department.
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                {canApproveHod && (
                  <>
                    <button disabled={acting} onClick={() => act(approveHod, 'approved')} className={`flex-1 text-sm font-medium rounded-lg py-2.5 disabled:opacity-60 ${isAdmin ? 'bg-success-light text-success border border-success/20 hover:bg-success/10' : 'bg-success text-white'}`}>{isAdmin ? 'Set HOD: Approved' : 'Approve as HOD'}</button>
                    <button disabled={acting} onClick={() => act(approveHod, 'rejected')} className={`flex-1 text-sm font-medium rounded-lg py-2.5 disabled:opacity-60 ${isAdmin ? 'bg-danger-light text-danger border border-danger/20 hover:bg-danger/10' : 'bg-danger text-white'}`}>{isAdmin ? 'Set HOD: Rejected' : 'Reject as HOD'}</button>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                {canApprovePrincipal && (
                  <>
                    <button disabled={acting} onClick={() => act(approvePrincipal, 'approved')} className={`flex-1 text-sm font-medium rounded-lg py-2.5 disabled:opacity-60 ${isAdmin ? 'bg-success-light text-success border border-success/20 hover:bg-success/10' : 'bg-success text-white'}`}>{isAdmin ? 'Set Principal: Approved' : 'Approve as Principal'}</button>
                    <button disabled={acting} onClick={() => act(approvePrincipal, 'rejected')} className={`flex-1 text-sm font-medium rounded-lg py-2.5 disabled:opacity-60 ${isAdmin ? 'bg-danger-light text-danger border border-danger/20 hover:bg-danger/10' : 'bg-danger text-white'}`}>{isAdmin ? 'Set Principal: Rejected' : 'Reject as Principal'}</button>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                {canApproveCampusManager && (
                  <>
                    <button disabled={acting} onClick={() => act(approveCampusManager, 'approved')} className={`flex-1 text-sm font-medium rounded-lg py-2.5 disabled:opacity-60 ${isAdmin ? 'bg-success-light text-success border border-success/20 hover:bg-success/10' : 'bg-success text-white'}`}>{isAdmin ? 'Set Campus Manager: Approved' : 'Approve as Campus Manager'}</button>
                    <button disabled={acting} onClick={() => act(approveCampusManager, 'rejected')} className={`flex-1 text-sm font-medium rounded-lg py-2.5 disabled:opacity-60 ${isAdmin ? 'bg-danger-light text-danger border border-danger/20 hover:bg-danger/10' : 'bg-danger text-white'}`}>{isAdmin ? 'Set Campus Manager: Rejected' : 'Reject as Campus Manager'}</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
