import React from 'react';
import { AlertTriangle, ArrowRight, Expand, Layers, ShieldAlert } from 'lucide-react';

interface LowDataModalProps {
  currentCount: number;
  targetCount: number;
  onDecision: (action: 'broaden_radius' | 'add_synonyms' | 'proceed_with_sparse') => void;
}

export const LowDataModal: React.FC<LowDataModalProps> = ({
  currentCount,
  targetCount,
  onDecision,
}) => {
  return (
    <div className="glass-panel-glow rounded-2xl p-6 border border-white/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 text-white shrink-0 shadow-gloss-reflection">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
              STEP 4 · LOW-DATA CHECKPOINT
            </span>
            <span className="text-xs text-zinc-400 font-mono">Sufficiency Loop Interrupted</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Sparse Results Detected ({currentCount} / {targetCount} Postings)
          </h3>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            The target search yielded fewer postings than the recommended statistical minimum ({targetCount}). How would you like the agent to adapt?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        <button
          type="button"
          onClick={() => onDecision('broaden_radius')}
          className="p-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/30 text-left transition-all group space-y-2 shadow-gloss-reflection"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <Expand className="w-4 h-4 text-white" />
              <span>Broaden Search Radius</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Expands radius by +50 km and relaxes metropolitan commuter boundaries to capture regional postings.
          </p>
          <span className="inline-block text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
            Recommended Action
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecision('add_synonyms')}
          className="p-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/30 text-left transition-all group space-y-2 shadow-gloss-reflection"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <span>Include Adjacent Titles</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Adds broader seniority variants (e.g. Lead, Senior, Consultant) to broaden the sample pool.
          </p>
          <span className="inline-block text-[10px] font-mono text-zinc-300 bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
            +30% estimated volume
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecision('proceed_with_sparse')}
          className="p-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/30 text-left transition-all group space-y-2 shadow-gloss-reflection"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              <span>Proceed with Weak Sample</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Continues to analysis with current postings. Insights will automatically be tagged with Medium or Low confidence.
          </p>
          <span className="inline-block text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
            Directional evidence only
          </span>
        </button>
      </div>
    </div>
  );
};
