import React from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_REPORTS } from '../mocks/sampleReports';
import { getOutlookBadgeProps, formatFullCurrency } from '../utils/formatters';
import { FileBarChart2, ArrowRight, MapPin, Calendar } from 'lucide-react';

export const ReportsIndexPage: React.FC = () => {
  const reportsList = Object.values(SAMPLE_REPORTS);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <FileBarChart2 className="w-4 h-4 text-white" />
          <span>STRUCTURED BRIEFS ARCHIVE</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Talent Market Reports Library
        </h1>
        <p className="text-sm text-zinc-300">
          Explore evidence-backed talent briefs across major technology roles and global recruitment geographies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsList.map((brief) => {
          const outlook = getOutlookBadgeProps(brief.hiringOutlook.verdict);

          return (
            <div
              key={brief.id}
              className="glass-panel-glow rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition-all group space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${outlook.color} ${outlook.bg} ${outlook.border}`}>
                    {outlook.title}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(brief.generatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-zinc-200 transition-colors">
                    {brief.role}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    <span>{brief.location}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                  {brief.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 shadow-gloss-reflection">
                    <span className="text-[10px] text-zinc-400 block">MEDIAN SALARY</span>
                    <span className="text-white font-bold">
                      {formatFullCurrency(brief.compensation.medianSalary, brief.compensation.currency)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 shadow-gloss-reflection">
                    <span className="text-[10px] text-zinc-400 block">EVIDENCE POSTS</span>
                    <span className="text-white font-bold">
                      {brief.demandVolume.sampleAnalyzed} verified
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={`/report/${brief.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white text-zinc-200 hover:text-black border border-white/10 text-xs font-semibold transition-all shadow-gloss-reflection hover:shadow-glow-white"
              >
                <span>View Full Intelligence Brief</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
