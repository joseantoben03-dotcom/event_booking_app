import React from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginButton from '../components/LoginButton';
import collegeLogo from '../assets/images (1).jpg';

export default function Login() {
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-10">
        <div className="flex flex-col items-center mb-6">
          <img src={collegeLogo} alt="Francis Xavier Engineering College" className="w-full max-w-xs h-auto" />
          <p className="text-sm text-slate-500 mt-4">Event Booking &amp; Approval Portal</p>
        </div>

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
  );
}
