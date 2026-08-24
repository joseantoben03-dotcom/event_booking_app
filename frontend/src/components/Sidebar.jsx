import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PORTAL_LABELS } from '../constants/roles';
import {
  HomeIcon,
  BuildingIcon,
  TicketIcon,
  ClipboardListIcon,
  ClockIcon,
  SettingsIcon,
  ShieldIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from './icons/Icons';

// "Book a Venue" is always visible - if the signed-in role can't create
// bookings, the page itself explains why, instead of the link vanishing
// silently (which made permission issues impossible to diagnose).
const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/events/new', icon: BuildingIcon, label: 'Book a Venue' },
  { to: '/my-bookings', icon: TicketIcon, label: 'My Bookings' },
  { to: '/previous-bookings', icon: ClockIcon, label: 'Previous Bookings' },
  { to: '/bookings', icon: ClipboardListIcon, label: 'All Bookings' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const portalLabel = user ? PORTAL_LABELS[user.designation] || 'PORTAL' : 'PORTAL';
  const navItems = isAdmin
    ? [...NAV_ITEMS, { to: '/admin', icon: ShieldIcon, label: 'Admin' }]
    : NAV_ITEMS;

  return (
    <>
      {/* Backdrop overlay - mobile only, shown while the drawer is open */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 md:z-auto
          bg-white border-r border-slate-200 flex flex-col
          transition-transform md:transition-[width] duration-200
          w-64 ${collapsed ? 'md:w-[76px]' : 'md:w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
            {!collapsed && (
              <span className="text-xs font-bold text-slate-500 tracking-wide truncate">{portalLabel}</span>
            )}
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-700 shrink-0">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-surface hover:text-slate-800'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 hidden md:block">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 py-2 rounded-lg hover:bg-surface transition"
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            {!collapsed && <span>Collapse Menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
