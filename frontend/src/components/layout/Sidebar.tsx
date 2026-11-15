import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home,
  PlusCircle, 
  Play, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  LogOut,
  Hexagon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'New Research', path: '/research/new', icon: PlusCircle },
    { name: 'Live Workflow', path: '/workflow', icon: Play },
    { name: 'Market Reports', path: '/reports', icon: BarChart3 },
    { name: 'HITL Checkpoints', path: '/hitl-sandbox', icon: ShieldCheck },
    { name: 'History & Runs', path: '/history', icon: Clock },
  ];

  return (
    <aside className="w-[280px] border-r border-[#1E2738] bg-[#0D1420] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-50 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1E2738] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FDE68A]/20 via-[#F5BA42]/10 to-transparent border border-[#F5BA42]/30 p-1">
              <Hexagon className="w-5 h-5 text-[#F5BA42] fill-[#F5BA42]/20" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                MarketScout
              </div>
              <span className="text-[10px] font-mono tracking-wider text-[#F5BA42] font-semibold bg-[#F5BA42]/10 px-2 py-0.5 rounded-full border border-[#F5BA42]/20">
                AI Agent v2.6
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pt-3 pb-1 text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
            INTELLIGENCE ENGINE
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FDE68A] via-[#FCE7A6] to-[#F59E0B] text-slate-950 font-bold text-sm shadow-sm transition-all'
                    : 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium text-sm transition-all'
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Operator User Card */}
      <div className="p-4 border-t border-[#1E2738] bg-[#0A0F18]/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#171E2B]/80 border border-[#283347] hover:border-slate-500 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-[#F5BA42]/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-[#F5BA42]/30 flex items-center justify-center text-xs font-bold text-[#F5BA42]">
                EO
              </div>
            )}
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || 'Evaluation Operator'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || 'operator@marketscout.ai'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>
    </aside>
  );
};
