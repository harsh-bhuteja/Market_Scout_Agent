import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Plus
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Command Center';
    if (location.pathname === '/research/new') return 'New Intelligence Scout';
    if (location.pathname.startsWith('/workflow')) return 'StateGraph Live Execution';
    if (location.pathname.startsWith('/report')) return 'Talent Market Brief';
    if (location.pathname === '/history') return 'Research History & Runs';
    if (location.pathname === '/hitl-sandbox') return 'HITL Checkpoint Sandbox';
    return 'Market Scout';
  };

  return (
    <header className="h-[72px] border-b border-[#1E2738] bg-[#0B101A]/90 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search reports, workflows..."
            className="w-64 pl-10 pr-4 py-2 bg-[#171E2B] border border-[#283347] focus:border-[#F5BA42]/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2.5 rounded-xl bg-[#171E2B] border border-[#283347] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#F5BA42] absolute top-2 right-2 ring-2 ring-[#0B101A]" />
        </button>

        {/* New Scout CTA */}
        <Link
          to="/research/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FDE68A] via-[#FCE7A6] to-[#F59E0B] hover:opacity-95 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Scout</span>
        </Link>
      </div>
    </header>
  );
};
