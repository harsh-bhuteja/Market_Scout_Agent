import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResearchStore } from '../hooks/useResearchStore';
import { getOutlookBadgeProps, formatFullCurrency } from '../utils/formatters';
import { 
  History, 
  Search, 
  Trash2, 
  RotateCcw, 
  ArrowRight, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { runs, deleteRun, resetToSampleData, clearAllHistory } = useResearchStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <History className="w-4 h-4 text-white" />
            <span>SESSION RUN AUDIT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Research History & Checkpointer Logs
          </h1>
          <p className="text-sm text-zinc-300">
            Browse stateful research executions. Resumed threads retain memory checkpoints.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToSampleData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs font-medium text-zinc-300 border border-white/10 transition-colors shadow-gloss-reflection"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Restore Samples</span>
          </button>
          <button
            type="button"
            onClick={clearAllHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-white border border-white/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by role or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
          >
            <option value="all">All Runs ({runs.length})</option>
            <option value="completed">Completed Only</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Runs Table / Cards */}
      {filteredRuns.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-white/[0.08] space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No research runs match your filter</h3>
          <p className="text-xs text-zinc-400">
            {searchQuery ? 'Try adjusting your search terms.' : 'No history runs stored yet.'}
          </p>
          <button
            type="button"
            onClick={resetToSampleData}
            className="text-xs font-semibold text-white underline"
          >
            Reset to sample runs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run) => {
            const outlook = run.hiringOutlook ? getOutlookBadgeProps(run.hiringOutlook) : null;

            return (
              <div
                key={run.id}
                className="glass-card rounded-2xl p-5 border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 shadow-gloss-reflection"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{run.role}</span>
                    <span className="text-zinc-600 text-xs">·</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-white" />
                      {run.location}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 pt-1">
                    <span>{new Date(run.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span>·</span>
                    <span>Thread: #{run.id}</span>
                    {run.salaryMedian && run.currency && (
                      <>
                        <span>·</span>
                        <span className="text-white font-bold">
                          Median: {formatFullCurrency(run.salaryMedian, run.currency)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {outlook && (
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border ${outlook.color} ${outlook.bg} ${outlook.border}`}>
                      {outlook.title}
                    </span>
                  )}

                  {run.briefId ? (
                    <Link
                      to={`/report/${run.briefId}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white text-zinc-200 hover:text-black border border-white/20 text-xs font-semibold transition-all hover:scale-[1.01] shadow-gloss-reflection hover:shadow-glow-white"
                    >
                      <span>Open Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/workflow`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
                    >
                      <span>Resume Thread</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteRun(run.id)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
