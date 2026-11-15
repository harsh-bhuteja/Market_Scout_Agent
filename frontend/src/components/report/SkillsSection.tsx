import React from 'react';
import { MarketBrief } from '../../types';
import { Award, CheckCircle, Star, Clock } from 'lucide-react';

export const SkillsSection: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  const { skillsAndRequirements } = brief;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Must-Have Skills */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Must-Have Technical Gatekeepers
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-300 font-semibold bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
            Deduplicated & Normalized
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Skills with mandatory mention rates across employer postings.
        </p>

        <div className="space-y-3 pt-2">
          {skillsAndRequirements.mustHaveSkills.map((skill) => (
            <div key={skill.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  {skill.name}
                </span>
                <span className="font-mono text-white font-bold">
                  {skill.percentage}% ({skill.frequency} mentions)
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700 shadow-glow-white"
                  style={{ width: `${skill.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Nice-to-Have Pill Cloud */}
        <div className="pt-4 border-t border-white/[0.08] space-y-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-zinc-300" />
            Differentiator / Nice-to-Have Skills
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {skillsAndRequirements.niceToHaveSkills.map((skill) => (
              <span
                key={skill.name}
                className="px-3 py-1 rounded-lg bg-zinc-950 border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-2 hover:border-white/20 transition-colors shadow-gloss-reflection"
              >
                <span>{skill.name}</span>
                <span className="text-[10px] font-mono text-white">
                  {skill.percentage}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Experience & Seniority Distribution */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Experience Requirement
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] text-center space-y-1 shadow-gloss-reflection">
          <div className="text-3xl font-black font-mono text-white">
            {skillsAndRequirements.typicalYearsExperience} yrs
          </div>
          <div className="text-xs text-zinc-400">
            Average Required Experience
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Tenure Brackets Mix
          </div>
          {skillsAndRequirements.experienceDistribution.map((item) => (
            <div key={item.bracket} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{item.bracket}</span>
                <span className="font-mono text-zinc-400">{item.percentage}%</span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-zinc-400 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
