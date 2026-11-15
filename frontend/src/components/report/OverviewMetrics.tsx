import React from 'react';
import { MarketBrief } from '../../types';
import { formatFullCurrency } from '../../utils/formatters';
import { TrendingUp, DollarSign, Eye, Building2 } from 'lucide-react';

export const OverviewMetrics: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Volume */}
      <div className="p-5 rounded-2xl glass-card space-y-2 border border-white/[0.08]">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>ACTIVE DEMAND</span>
          <TrendingUp className="w-4 h-4 text-zinc-300" />
        </div>
        <div className="text-2xl font-black text-white font-mono">
          {brief.demandVolume.totalActivePostings.toLocaleString()}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white font-semibold">
            {brief.demandVolume.trend30Day > 0 ? '+' : ''}{brief.demandVolume.trend30Day}%
          </span>
          <span className="text-zinc-400">vs previous 30d</span>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Sample Analyzed: {brief.demandVolume.sampleAnalyzed} posts
        </div>
      </div>

      {/* Metric 2: Median Salary */}
      <div className="p-5 rounded-2xl glass-card space-y-2 border border-white/[0.08]">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>MEDIAN BENCHMARK</span>
          <DollarSign className="w-4 h-4 text-white" />
        </div>
        <div className="text-2xl font-black text-white font-mono">
          {formatFullCurrency(brief.compensation.medianSalary, brief.compensation.currency)}
        </div>
        <div className="text-xs text-zinc-400 truncate">
          IQR: {formatFullCurrency(brief.compensation.percentile25, brief.compensation.currency)} – {formatFullCurrency(brief.compensation.percentile75, brief.compensation.currency)}
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Annual Normalized ({brief.compensation.currency})
        </div>
      </div>

      {/* Metric 3: Pay Transparency Rate */}
      <div className="p-5 rounded-2xl glass-card space-y-2 border border-white/[0.08]">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>PAY TRANSPARENCY</span>
          <Eye className="w-4 h-4 text-zinc-300" />
        </div>
        <div className="text-2xl font-black text-white font-mono">
          {brief.compensation.disclosedPayPercentage}%
        </div>
        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className="bg-white h-full rounded-full"
            style={{ width: `${brief.compensation.disclosedPayPercentage}%` }}
          />
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Postings with explicit pay rate
        </div>
      </div>

      {/* Metric 4: Agency vs Direct Split */}
      <div className="p-5 rounded-2xl glass-card space-y-2 border border-white/[0.08]">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>EMPLOYER PROFILE</span>
          <Building2 className="w-4 h-4 text-zinc-300" />
        </div>
        <div className="text-2xl font-black text-white font-mono">
          {brief.employerCompetition.agencyVsDirect.directPercent}% Direct
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="text-zinc-200 font-medium">
            {brief.employerCompetition.agencyVsDirect.agencyPercent}% Agency
          </span>
          <span>split</span>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Direct brands dominant
        </div>
      </div>
    </div>
  );
};
