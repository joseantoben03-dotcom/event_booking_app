import React from 'react';

const STYLES = {
  'Fully approved': 'bg-success-light text-success',
  'Pending HOD approval': 'bg-warning-light text-warning',
  'Approved by HOD, pending Principal approval': 'bg-warning-light text-warning',
  'Approved by HOD and Principal, pending Campus Manager approval': 'bg-warning-light text-warning',
  Cancelled: 'bg-slate-100 text-slate-500',
};

export default function StatusBadge({ status }) {
  const isRejected = status?.startsWith('Rejected');
  const cls = isRejected ? 'bg-danger-light text-danger' : STYLES[status] || 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
