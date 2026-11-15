import React from 'react';
import { MarketBrief } from '../../types';
import { Building, Tag } from 'lucide-react';

export const EmployerSection: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  const { employerCompetition, observedTitles } = brief;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Hiring Employers Table */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Top Active Employers
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Hiring Volume Leaders
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Organizations with highest active requisition counts in target geography.
        </p>

        <div className="space-y-2.5 pt-2">
          {employerCompetition.topEmployers.map((emp) => (
            <div
              key={emp.name}
              className="p-3 rounded-xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between shadow-gloss-reflection"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-200">{emp.name}</div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      emp.type === 'Direct'
                        ? 'text-white bg-white/10 border-white/20'
                        : 'text-zinc-400 bg-white/[0.04] border-white/10'
                    }`}
                  >
                    {emp.type} Employer
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">
                  {emp.openPositions} positions
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {emp.marketSharePercent}% share
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observed Title Variants */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Observed Job Title Variants
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">Real Postings</span>
        </div>

        <p className="text-xs text-zinc-400">
          Actual titles used by competing recruiters to advertise this role.
        </p>

        <div className="space-y-3 pt-2">
          {observedTitles.map((titleItem) => (
            <div key={titleItem.title} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-200 font-medium">{titleItem.title}</span>
                <span className="font-mono text-zinc-400 text-xs">
                  {titleItem.sharePercent}% ({titleItem.count})
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-white rounded-full shadow-glow-white"
                  style={{ width: `${titleItem.sharePercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
