import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResearchStore } from '../hooks/useResearchStore';
import { useResearchRun } from '../hooks/useResearchRun';
import { USE_REAL_BACKEND } from '../services/api';
import { WorkflowVisualizer } from '../components/workflow/WorkflowVisualizer';
import { ClarificationModal } from '../components/hitl/ClarificationModal';
import { SearchPlanModal } from '../components/hitl/SearchPlanModal';
import { LowDataModal } from '../components/hitl/LowDataModal';
import { GitFork } from 'lucide-react';

export const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeRequest } = useResearchStore();
  const runId = searchParams.get('runId') || 'run-active';

  const {
    state,
    resolveClarification,
    resolveSearchPlanApproval,
    resolveLowDataDecision,
    togglePause,
    setSpeed,
    fastForwardToFinish,
  } = useResearchRun(runId, activeRequest);

  const handleViewReport = () => {
    if (state.completedBriefId) {
      navigate(`/report/${state.completedBriefId}`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Top Header & Context */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <GitFork className="w-4 h-4 text-white" />
            <span>STATEFUL AGENT RUN · THREAD: {runId}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{activeRequest?.role || 'Data Analyst'}</span>
            <span className="text-zinc-600 font-normal">in</span>
            <span className="text-white font-normal">{activeRequest?.location || 'Bangalore, India'}</span>
          </h1>
          <p className="text-xs text-zinc-400">
            {USE_REAL_BACKEND
              ? 'Live LangGraph thread with interrupt() checkpoints, SQLite checkpointer, and Adzuna tool calling.'
              : 'Demo simulation of the LangGraph execution graph. Enable VITE_USE_BACKEND_API for live runs.'}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-right font-mono text-xs">
            <span className="text-zinc-500 text-[10px] block">GRAPH NODE</span>
            <span className="text-white font-bold">Node 0{state.currentStageId} / 06</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-right font-mono text-xs">
            <span className="text-zinc-500 text-[10px] block">CHECKPOINTER</span>
            <span className="text-zinc-200 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              {USE_REAL_BACKEND ? 'SqliteSaver' : 'MemorySaver'}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE HITL CHECKPOINT PANEL */}
      {state.checkpoint && (
        <div className="animate-fadeIn">
          {state.checkpoint.type === 'clarification' && state.checkpoint.clarificationQuestions && (
            <ClarificationModal
              questions={state.checkpoint.clarificationQuestions}
              onSubmit={resolveClarification}
            />
          )}

          {state.checkpoint.type === 'search_plan_approval' && state.checkpoint.searchPlanDraft && (
            <SearchPlanModal
              initialPlan={state.checkpoint.searchPlanDraft}
              onApprove={resolveSearchPlanApproval}
            />
          )}

          {state.checkpoint.type === 'low_data_decision' && (
            <LowDataModal
              currentCount={state.checkpoint.lowDataDecision?.currentCount ?? state.postingsCounter}
              targetCount={state.checkpoint.lowDataDecision?.targetCount ?? 150}
              onDecision={resolveLowDataDecision}
            />
          )}
        </div>
      )}

      {/* Workflow Timeline & Node Stream */}
      <WorkflowVisualizer
        stages={state.stages}
        currentStageId={state.currentStageId}
        isPaused={state.isPaused}
        isCompleted={state.isCompleted}
        speed={state.speed}
        postingsCounter={state.postingsCounter}
        logs={state.streamLogs}
        onTogglePause={togglePause}
        onSetSpeed={setSpeed}
        onFastForward={fastForwardToFinish}
        onViewReport={handleViewReport}
      />
    </div>
  );
};
