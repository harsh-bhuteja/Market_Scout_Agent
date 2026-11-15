import React, { useRef, useEffect } from 'react';
import { WorkflowStage } from '../../types';
import { 
  Play, 
  Pause, 
  FastForward, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Radio, 
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

interface WorkflowVisualizerProps {
  stages: WorkflowStage[];
  currentStageId: number;
  isPaused: boolean;
  isCompleted: boolean;
  speed: number;
  postingsCounter: number;
  logs: Array<{ id: string; timestamp: string; stageId: number; text: string; level: 'info' | 'agent' | 'tool' | 'hitl' | 'success' }>;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onFastForward: () => void;
  onViewReport?: () => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  stages,
  currentStageId,
  isPaused,
  isCompleted,
  speed,
  postingsCounter,
  logs,
  onTogglePause,
  onSetSpeed,
  onFastForward,
  onViewReport,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    // If user is near the bottom (within 50px), auto‑scroll
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Simulation Control Toolbar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-mono shadow-gloss-reflection">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-white shadow-[0_0_8px_#ffffff]' : isPaused ? 'bg-zinc-400' : 'bg-white animate-pulse'}`} />
            <span className="text-zinc-200 font-semibold">
              {isCompleted ? 'WORKFLOW COMPLETE' : isPaused ? 'PAUSED' : 'STATEGRAPH RUNNING'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>Postings Indexed: <strong className="text-white font-bold">{postingsCounter}</strong></span>
          </div>
        </div>

        {/* Speed & Actions */}
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <>
              <button
                type="button"
                onClick={onTogglePause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-zinc-300 border border-white/10 transition-colors"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-white" /> : <Pause className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <div className="flex items-center bg-white/[0.05] rounded-lg p-0.5 border border-white/10">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSetSpeed(s)}
                    className={`px-2 py-1 text-[11px] font-mono rounded ${
                      speed === s ? 'bg-white text-black font-bold shadow-gloss-reflection' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onFastForward}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-glow-white transition-all"
                title="Instantly generate report"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Fast-Forward</span>
              </button>
            </>
          )}

          {isCompleted && onViewReport && (
            <button
              type="button"
              onClick={onViewReport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-glow-white border border-white/20 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Open Talent Market Brief</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 6 Stage Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const isActive = stage.id === currentStageId && !isCompleted;
          const isDone = stage.status === 'completed';
          const isStagePaused = stage.status === 'paused';

          return (
            <div
              key={stage.id}
              className={`p-4 rounded-xl transition-all relative overflow-hidden border ${
                isActive
                  ? 'glass-panel-glow border-white/30 shadow-glow-white'
                  : isDone
                  ? 'glass-card border-white/15 bg-white/[0.04]'
                  : isStagePaused
                  ? 'glass-card border-white/30 bg-zinc-950'
                  : 'glass-card opacity-50 border-white/[0.06]'
              }`}
            >
              {/* Progress Bar Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-400">
                  NODE 0{stage.id}
                </span>

                {isDone ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>DONE</span>
                  </span>
                ) : isStagePaused ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-300 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-300" />
                    <span>HITL PAUSE</span>
                  </span>
                ) : isActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white">
                    <Radio className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>RUNNING</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-zinc-600">PENDING</span>
                )}
              </div>

              <h4 className="text-xs font-bold text-white mb-1 leading-snug">
                {stage.title}
              </h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                {stage.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-500 ${
                    isDone
                      ? 'bg-white'
                      : isStagePaused
                      ? 'bg-zinc-400'
                      : 'bg-gradient-to-r from-zinc-400 to-white'
                  }`}
                  style={{ width: `${stage.progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Streaming Terminal Log Console */}
      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-zinc-950 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-mono text-zinc-200 font-semibold">
              LangGraph State Stream & Node Tracing
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <span>THREAD_ID: tr-88120</span>
            <span>·</span>
            <span>CHECKPOINTER: active</span>
          </div>
        </div>

        <div ref={logContainerRef} className="p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-2 bg-black/80 scrollbar-thin">
          {logs.map((log) => {
            let badgeStyle = 'text-zinc-400 bg-white/[0.04] border-white/5';
            let prefix = 'INFO';

            if (log.level === 'agent') {
              badgeStyle = 'text-white bg-white/10 border-white/20';
              prefix = 'AGENT';
            } else if (log.level === 'tool') {
              badgeStyle = 'text-zinc-200 bg-white/[0.08] border-white/15';
              prefix = 'TOOL';
            } else if (log.level === 'hitl') {
              badgeStyle = 'text-white bg-white/20 border-white/40 font-bold shadow-gloss-reflection';
              prefix = 'HITL';
            } else if (log.level === 'success') {
              badgeStyle = 'text-white bg-white/15 border-white/30 font-bold';
              prefix = 'OK';
            }

            return (
              <div key={log.id} className="flex items-start gap-3 text-[11px] leading-relaxed">
                <span className="text-zinc-600 shrink-0 select-none">{log.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border shrink-0 font-mono ${badgeStyle}`}>
                  {prefix}
                </span>
                <span className="text-zinc-300 break-words">{log.text}</span>
              </div>
            );
          })}
          
        </div>
      </div>
    </div>
  );
};
