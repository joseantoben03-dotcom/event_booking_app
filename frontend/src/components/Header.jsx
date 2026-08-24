import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { listEvents } from '../services/eventService';
import { PORTAL_LABELS, designationLabel } from '../constants/roles';
import { MenuIcon, BellIcon, ChevronDownIcon, LogoutIcon } from './icons/Icons';

function eventHasEnded(event) {
  return new Date(`${event.event_date}T${event.end_time}`) < new Date();
}

export default function Header({ onMenuClick }) {
  const { user, clearSession, isHod, isPrincipal, isCampusManager } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      try {
        const events = await listEvents();
        if (cancelled) return;
        const activeEvents = events.filter((event) => !eventHasEnded(event));
        let count = 0;
        if (isHod)
          count = activeEvents.filter(
            (e) => e.hod_approved === 'pending' && !e.is_cancelled && e.creator?.department === user.department
          ).length;
        else if (isPrincipal)
          count = activeEvents.filter((e) => e.hod_approved === 'approved' && e.principal_approved === 'pending' && !e.is_cancelled).length;
        else if (isCampusManager)
          count = activeEvents.filter(
            (e) => e.hod_approved === 'approved' && e.principal_approved === 'approved' && e.campus_manager_approved === 'pending' && !e.is_cancelled
          ).length;
        else if (user)
          count = activeEvents.filter((e) => e.user_id === user.id && e.status !== 'Fully approved' && !e.status.startsWith('Rejected') && e.status !== 'Cancelled').length;
        setPendingCount(count);
      } catch {
        // notification count is best-effort; ignore failures silently
      }
    }
    if (!user) {
      setPendingCount(0);
      return undefined;
    }

    loadCount();
    const refreshTimer = window.setInterval(loadCount, 30000);
    window.addEventListener('focus', loadCount);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', loadCount);
    };
  }, [user, isHod, isPrincipal, isCampusManager]);

  async function handleLogout() {
    await logout();
    clearSession();
    navigate('/login');
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';
  const portalLabel = user ? PORTAL_LABELS[user.designation] || 'PORTAL' : '';
  const notificationTarget = isHod
    ? '/bookings?status=pending_hod'
    : isPrincipal
    ? '/bookings?status=pending_principal'
    : isCampusManager
    ? '/bookings?status=pending_campus_manager'
    : '/my-bookings';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 py-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-500 hover:text-slate-800 shrink-0 -ml-1 p-1.5 rounded-lg hover:bg-surface transition"
          aria-label="Open menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shrink-0">
            FXEC
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-slate-800">FRANCIS XAVIER</span>
              <span className="text-[10px] bg-primary-light text-white font-medium px-2 py-0.5 rounded">AUTONOMOUS</span>
            </div>
            <div className="text-sm sm:text-base text-slate-400 tracking-wide">
              ENGINEERING COLLEGE &bull; EVENT BOOKING 
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate(notificationTarget)}
            className="relative w-9 h-9 rounded-full bg-surface hover:bg-slate-200 flex items-center justify-center transition"
            title={isHod || isPrincipal || isCampusManager ? 'Approval requests' : 'Your pending bookings'}
          >
            <BellIcon className="w-5 h-5 text-slate-600" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                {pendingCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 bg-surface hover:bg-slate-200 rounded-lg px-2 sm:px-2.5 py-1.5 transition"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {initial}
              </div>
              <div className="leading-tight text-left hidden sm:block">
                <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                <div className="text-[11px] text-slate-400">{portalLabel}</div>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-card py-1 text-sm">
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100 sm:hidden">
                  {user?.name}
                </div>
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
                  {designationLabel(user?.designation)}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-danger hover:bg-danger-light transition"
                >
                  <LogoutIcon className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
