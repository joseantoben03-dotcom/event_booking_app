import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400">
      &copy; {new Date().getFullYear()} Francis Xavier Engineering College &bull; Event Booking &amp; Approval ERP
    </footer>
  );
}
