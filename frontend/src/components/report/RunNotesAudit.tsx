import React from 'react';
import { MarketBrief } from '../../types';
import { Terminal } from 'lucide-react';

export const RunNotesAudit: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  const { runNotes } = brief;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-300" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Agent Run Notes & Audit Trail
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Duration: {runNotes.executionTimeSeconds}s
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric stats */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-1 shadow-gloss-reflection">
          <span className="text-[11px] font-mono text-zinc-500">RAW POSTINGS FETCHED</span>
          <div className="text-xl font-bold font-mono text-white">
            {runNotes.postingsFetched}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-1 shadow-gloss-reflection">
          <span className="text-[11px] font-mono text-zinc-500">CROSS-BOARD DEDUPLICATED</span>
          <div className="text-xl font-bold font-mono text-white">
            {runNotes.dedupedDuplicatesCount} removed
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-1 shadow-gloss-reflection">
          <span className="text-[11px] font-mono text-zinc-500">FINAL ANALYZED SAMPLE</span>
          <div className="text-xl font-bold font-mono text-white">
            {runNotes.postingsAnalyzed} postings
          </div>
        </div>
      </div>

      {/* Questions Asked & Answered */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-2 shadow-gloss-reflection">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          HITL Clarifications Addressed
        </span>
        {runNotes.questionsAndAnswers.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">
            None. Initial hiring request satisfied specificity threshold; direct path taken.
          </p>
        ) : (
          <div className="space-y-2">
            {runNotes.questionsAndAnswers.map((qa, i) => (
              <div key={i} className="text-xs space-y-0.5">
                <div className="text-zinc-300 font-medium">Q: {qa.question}</div>
                <div className="text-white font-mono pl-4">↳ Answer: {qa.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assumptions & Methodology */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-2 shadow-gloss-reflection">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Model Assumptions & Methodology
        </span>
        <ul className="text-xs text-zinc-400 space-y-1 list-disc pl-4">
          {runNotes.assumptionsMade.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
          <li>Data source: {runNotes.dataSource}</li>
        </ul>
      </div>
    </div>
  );
};
