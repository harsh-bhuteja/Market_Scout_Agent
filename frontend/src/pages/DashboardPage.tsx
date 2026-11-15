import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResearchStore } from '../hooks/useResearchStore';
import { getOutlookBadgeProps, formatFullCurrency } from '../utils/formatters';
import { 
  Sparkles, 
  ArrowRight, 
  PlusCircle, 
  History, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Play,
  RotateCcw,
  BarChart2,
  FlaskConical,
  Layers,
  Network
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { runs, resetToSampleData } = useResearchStore();
  const [showEmptyState, setShowEmptyState] = useState(false);

  const displayRuns = showEmptyState ? [] : runs;

  const quickPresets = [
    { 
      role: 'Data Analyst', 
      location: 'Bangalore, India', 
      currency: 'INR', 
      desc: 'Entry–Mid level role analysis.',
      icon: BarChart2,
      activeBorder: true
    },
    { 
      role: 'Senior ML Research Engineer', 
      location: 'San Francisco, CA', 
      currency: 'USD', 
      desc: 'Compensation, skills & market mapping.',
      icon: FlaskConical,
      activeBorder: false
    },
    { 
      role: 'Software Engineer', 
      location: 'Texas, USA', 
      currency: 'USD', 
      desc: 'Role evaluation with checkpoints.',
      icon: Layers,
      activeBorder: false
    },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* 1. Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#171E2B] border border-[#283347] p-8 lg:p-12 shadow-xl">
        {/* Abstract Glowing Curved Ribbons Artwork (Right Side) */}
        <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none overflow-hidden select-none hidden md:block">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 600 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5BA42" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#D97706" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#171E2B" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="blueRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#1E40AF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0B101A" stopOpacity="0" />
              </linearGradient>
              <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="30" />
              </filter>
            </defs>
            {/* Background ambient amber flare */}
            <circle cx="480" cy="90" r="140" fill="#F5BA42" fillOpacity="0.2" filter="url(#blurFilter)" />
            {/* Blue ambient flow */}
            <circle cx="380" cy="240" r="160" fill="#2563EB" fillOpacity="0.12" filter="url(#blurFilter)" />
            {/* Flowing Ribbon 1 (Blueish) */}
            <path
              d="M150 320 C 300 280, 420 180, 580 80 C 600 70, 620 50, 640 40"
              stroke="url(#blueRibbon)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
            {/* Flowing Ribbon 2 (Warm Golden) */}
            <path
              d="M200 340 C 320 290, 410 150, 590 50"
              stroke="url(#goldGlow)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
            {/* Ribbon glow highlights */}
            <path
              d="M260 300 C 360 250, 440 160, 570 70"
              stroke="#FFFBEB"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.75"
            />
            <path
              d="M180 340 C 310 300, 430 200, 540 140"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Hero Left Content */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5BA42]/10 border border-[#F5BA42]/30 text-xs font-semibold text-[#F5BA42]">
            <Sparkles className="w-3.5 h-3.5 text-[#F5BA42]" />
            <span>Talent Market Intelligence Agent</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Turn Hiring Requests into<br />
            <span className="text-white">Evidence-Backed Market Briefs.</span>
          </h1>

          <p className="text-sm lg:text-base text-slate-300 leading-relaxed font-normal">
            Crawl live job postings, analyze compensation, verify skills, and resolve ambiguous searches with human-in-the-loop checkpoints.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <Link
              to="/research/new"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FDE68A] via-[#FCE7A6] to-[#F59E0B] hover:opacity-95 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start New Market Scout</span>
            </Link>

            <Link
              to="/workflow"
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#0D1420]/80 hover:bg-[#0D1420] border border-[#283347] hover:border-slate-500 text-white font-medium text-sm transition-all"
            >
              <Zap className="w-4 h-4 text-slate-400" />
              <span>View Live Workflow</span>
            </Link>

            <Link
              to="/hitl-sandbox"
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#0D1420]/80 hover:bg-[#0D1420] border border-[#283347] hover:border-slate-500 text-white font-medium text-sm transition-all"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>HITL Sandbox</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Unified Statistics Section (Single Continuous Horizontal Panel) */}
      <div className="rounded-2xl bg-[#171E2B] border border-[#283347] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#283347] p-5 shadow-lg">
        {/* Column 1: Indexed Postings */}
        <div className="flex items-center gap-4 p-3 lg:p-4">
          <div className="w-12 h-12 rounded-xl bg-[#0D1420] border border-[#283347] flex items-center justify-center shrink-0 text-[#F5BA42]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Indexed Postings</div>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">4,450+</div>
          </div>
        </div>

        {/* Column 2: Median Normalized */}
        <div className="flex items-center gap-4 p-3 lg:p-4">
          <div className="w-12 h-12 rounded-xl bg-[#0D1420] border border-[#283347] flex items-center justify-center shrink-0 text-[#F5BA42]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Median Normalized</div>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">IQR Verified</div>
          </div>
        </div>

        {/* Column 3: HITL Checkpoints */}
        <div className="flex items-center gap-4 p-3 lg:p-4">
          <div className="w-12 h-12 rounded-xl bg-[#0D1420] border border-[#283347] flex items-center justify-center shrink-0 text-[#F5BA42]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">HITL Checkpoints</div>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">3 Guardrails</div>
          </div>
        </div>

        {/* Column 4: LangGraph State */}
        <div className="flex items-center gap-4 p-3 lg:p-4">
          <div className="w-12 h-12 rounded-xl bg-[#0D1420] border border-[#283347] flex items-center justify-center shrink-0 text-[#F5BA42]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">LangGraph State</div>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">6 Nodes</div>
          </div>
        </div>
      </div>

      {/* 3. Assessment Evaluation Presets */}
      <div className="space-y-3.5">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Assessment Evaluation Presets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickPresets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.role}
                type="button"
                onClick={() => {
                  navigate(`/research/new?role=${encodeURIComponent(preset.role)}&location=${encodeURIComponent(preset.location)}&currency=${preset.currency}`);
                }}
                className={`p-5 rounded-2xl text-left bg-[#171E2B] transition-all group flex items-center justify-between gap-4 shadow-sm hover:-translate-y-0.5 ${
                  preset.activeBorder 
                    ? 'border border-[#F5BA42]/40 hover:border-[#F5BA42]' 
                    : 'border border-[#283347] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#0D1420] border border-[#283347] flex items-center justify-center shrink-0 text-[#F5BA42]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm truncate group-hover:text-white transition-colors">
                      {preset.role}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {preset.desc}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#0D1420] border border-[#283347] group-hover:border-slate-400 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Intelligence Runs */}
      <div className="rounded-2xl bg-[#171E2B] border border-[#283347] p-6 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Recent Intelligence Runs
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Previous research briefs and cached checkpointer states in SQLite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmptyState(!showEmptyState)}
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-[#0D1420] border border-[#283347] hover:border-slate-500 transition-colors"
            >
              Toggle Empty State ({showEmptyState ? 'ON' : 'OFF'})
            </button>
            <button
              type="button"
              onClick={resetToSampleData}
              className="text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-[#0D1420] border border-[#283347] hover:border-slate-500 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F5BA42]" />
              Reset Samples
            </button>
          </div>
        </div>

        {displayRuns.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0D1420] border border-[#283347] flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6 text-[#F5BA42]" />
            </div>
            <h3 className="text-sm font-semibold text-white">No research runs in memory</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Launch your first talent market intelligence query to build an evidence-backed brief.
            </p>
            <Link
              to="/research/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FDE68A] to-[#F59E0B] text-slate-950 text-xs font-bold hover:opacity-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Launch Scout</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayRuns.map((run) => {
              const outlook = run.hiringOutlook ? getOutlookBadgeProps(run.hiringOutlook) : null;

              return (
                <div
                  key={run.id}
                  className="p-4 rounded-xl bg-[#0D1420]/80 border border-[#283347] hover:border-slate-500 transition-all flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{run.role}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-xs text-slate-400">{run.location}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>{new Date(run.createdAt).toLocaleDateString()}</span>
                      {run.totalPostingsIndexed && (
                        <span>{run.totalPostingsIndexed} postings indexed</span>
                      )}
                      {run.salaryMedian && run.currency && (
                        <span className="text-[#F5BA42] font-semibold">
                          Median: {formatFullCurrency(run.salaryMedian, run.currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {outlook && (
                      <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${outlook.color} ${outlook.bg} ${outlook.border}`}>
                        {outlook.title}
                      </span>
                    )}

                    {run.briefId ? (
                      <Link
                        to={`/report/${run.briefId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171E2B] hover:bg-[#1E2738] border border-[#283347] text-white text-xs font-semibold transition-colors"
                      >
                        <span>Open Brief</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#F5BA42]" />
                      </Link>
                    ) : (
                      <Link
                        to={`/workflow`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171E2B] hover:bg-[#1E2738] border border-[#283347] text-xs text-slate-300 font-medium"
                      >
                        <Play className="w-3 h-3 text-[#F5BA42] fill-[#F5BA42]" />
                        <span>Resume</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
