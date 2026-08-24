import React from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { designationLabel } from '../constants/roles';

export default function Settings() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-lg font-bold text-slate-800 mb-1">Settings</h1>
        <p className="text-sm text-slate-500 mb-6">Your account details as registered by the institution.</p>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="min-w-0">
              <div className="text-slate-400 text-xs">Name</div>
              <div className="text-slate-700 font-medium break-words">{user?.name}</div>
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-xs">Email</div>
              <div className="text-slate-700 font-medium break-all">{user?.email}</div>
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-xs">Designation</div>
              <div className="text-slate-700 font-medium break-words">{designationLabel(user?.designation)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-xs">Department</div>
              <div className="text-slate-700 font-medium break-words">{user?.department}</div>
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-xs">Contact No.</div>
              <div className="text-slate-700 font-medium break-words">{user?.contactno || '-'}</div>
            </div>
          </div>

          <p className="text-xs text-slate-400 border-t border-slate-100 pt-4 break-words">
            To update your profile details, contact the ERP administrator &mdash; account records are managed
            centrally to keep the approval chain accurate.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
