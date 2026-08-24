import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex flex-1 min-w-0">
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-[1440px] mx-auto w-full">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
