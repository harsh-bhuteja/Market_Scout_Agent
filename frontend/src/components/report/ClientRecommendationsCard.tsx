import React from 'react';
import { MarketBrief } from '../../types';
import { formatFullCurrency } from '../../utils/formatters';
import { Target, Lightbulb, MessageSquareQuote } from 'lucide-react';

export const ClientRecommendationsCard: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  const { clientRecommendations, compensation } = brief;

  return (
    <div className="glass-panel-glow rounded-3xl p-6 lg:p-8 border border-white/[0.12] relative overflow-hidden space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/20 text-white shadow-gloss-reflection">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
            CSM Client Advisory
          </span>
          <h2 className="text-xl font-extrabold text-white">
            Actionable Strategic Recommendations
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Job Title & Salary Band */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/[0.08] space-y-4 shadow-gloss-reflection">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              01. Suggested Job Title
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {clientRecommendations.suggestedJobTitle}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              02. Recommended Comp Band ({compensation.currency})
            </span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatFullCurrency(clientRecommendations.recommendedSalaryBand.min, compensation.currency)} – {formatFullCurrency(clientRecommendations.recommendedSalaryBand.max, compensation.currency)}
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {clientRecommendations.recommendedSalaryBand.rationale}
            </p>
          </div>
        </div>

        {/* Lead Skills & Strategic Takeaway */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/[0.08] space-y-4 shadow-gloss-reflection">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              03. Top Skills to Lead JD With
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {clientRecommendations.leadSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white shadow-gloss-reflection"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-zinc-300" />
              Strategic Positioning Takeaway
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {clientRecommendations.strategicTakeaway}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Ad Copy Hook */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex items-start gap-3 shadow-gloss-reflection">
        <MessageSquareQuote className="w-5 h-5 text-white shrink-0 mt-0.5" />
        <div>
          <span className="text-[11px] font-mono text-zinc-300 font-semibold uppercase">
            Recommended Job Ad Opening Hook
          </span>
          <p className="text-xs text-zinc-200 italic mt-0.5">
            "{clientRecommendations.jobDescriptionHook}"
          </p>
        </div>
      </div>
    </div>
  );
};
