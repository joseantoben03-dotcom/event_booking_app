import React from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginButton from '../components/LoginButton';

export default function Login() {
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-3xl ">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-card">
            FXEC
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-800 text-center">
            FRANCIS XAVIER ENGINEERING COLLEGE
          </h1>
          <p className="text-xs text-primary font-medium text-center mt-1">
            AUTONOMOUS INSTITUTION &bull; AFFILIATED TO ANNA UNIVERSITY &bull; NAAC 'A+' GRADE
          </p>
          <p className="text-sm text-slate-500 mt-2">Event Booking &amp; Approval Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-12">
          {error && (
            <div className="bg-danger-light text-danger text-sm rounded-lg px-4 py-2 mb-4">
              {decodeURIComponent(error)}
            </div>
          )}

          <p className="text-sm text-slate-500 mb-4 text-center">
            Sign in with your institutional Google account to continue.
          </p>

          <LoginButton />

          <p className="text-xs text-slate-400 text-center mt-5 flex items-center justify-center gap-1">
           Only registered institutional emails can sign in
          </p>
        </div>
      </div>
    </div>
  );
}
