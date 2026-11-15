import React from 'react';
import { MarketBrief } from '../../types';
import { formatFullCurrency } from '../../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Coins, Layers } from 'lucide-react';

export const CompensationCharts: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  const { compensation } = brief;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Salary Distribution Bands */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Compensation Distribution
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Currency: {compensation.currency}
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Distribution of postings disclosing salary compensation, normalized to annual compensation.
        </p>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compensation.distributionBands}>
              <XAxis 
                dataKey="band" 
                stroke="#71717a" 
                fontSize={11} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={11} 
                tickLine={false} 
                unit="%" 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
                }}
                formatter={(value: any, name: any, item: any) => [
                  `${value}% (${item.payload.count} postings)`,
                  'Share of Postings',
                ]}
              />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {compensation.distributionBands.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 1 ? '#FFFFFF' : index === 2 ? '#D4D4D8' : '#27272A'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs text-zinc-400 font-mono">
          <span>Observed Min: {formatFullCurrency(compensation.salaryMin, compensation.currency)}</span>
          <span className="text-white font-bold">Median: {formatFullCurrency(compensation.medianSalary, compensation.currency)}</span>
          <span>Max: {formatFullCurrency(compensation.salaryMax, compensation.currency)}</span>
        </div>
      </div>

      {/* Seniority Progression Breakdown */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Seniority Progression Benchmarks
            </h3>
          </div>
          <span className="text-xs font-mono text-white font-semibold">Market Percentiles</span>
        </div>

        <p className="text-xs text-zinc-400">
          Target salary brackets observed for various tenure levels across active postings.
        </p>

        <div className="space-y-3 pt-2">
          {compensation.seniorityBreakdown.map((item) => {
            const hasSalary = (item.median || 0) > 0 && (item.min || 0) > 0;
            return (
              <div
                key={item.level}
                className="p-3.5 rounded-xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between hover:border-white/20 transition-colors shadow-gloss-reflection"
              >
                <div>
                  <div className="text-xs font-bold text-white">{item.level}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {hasSalary
                      ? `Range: ${formatFullCurrency(item.min, compensation.currency)} – ${formatFullCurrency(item.max, compensation.currency)}`
                      : 'Salary Range: Insufficient disclosed data'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-mono text-white">
                    {hasSalary ? formatFullCurrency(item.median, compensation.currency) : '—'}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">
                    {hasSalary ? 'Target Median' : 'Insufficient Data'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
