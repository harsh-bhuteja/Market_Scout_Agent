import { useCallback, useEffect, useRef, useState } from 'react';
import { HITLCheckpoint, HiringRequest, SearchPlan, WorkflowStage } from '../types';
import { apiService, USE_REAL_BACKEND } from '../services/api';
import { SimulationState, useResearchSimulation } from './useResearchSimulation';
import { WORKFLOW_STAGES_CONFIG } from '../mocks/sampleReports';

function emptyStages(): WorkflowStage[] {
  return WORKFLOW_STAGES_CONFIG.map((c) => ({
    id: c.id as WorkflowStage['id'],
    name: c.name,
    title: c.title,
    description: c.description,
    status: c.id === 1 ? 'active' : 'pending',
    progressPercent: 0,
    logs: [],
  }));
}

export function useResearchRun(
  runId: string,
  request: HiringRequest | null,
  onComplete?: (briefId: string) => void
) {
  const simulation = useResearchSimulation(runId, request, onComplete);

  const [state, setState] = useState<SimulationState>({
    currentStageId: 1,
    stages: emptyStages(),
    checkpoint: null,
    isPaused: false,
    isCompleted: false,
    speed: 1,
    streamLogs: [],
    postingsCounter: 0,
    activePostingsSample: [],
    completedBriefId: null,
  });
  const completedRef = useRef(false);

  const applySnapshot = useCallback(
    (snap: any) => {
      if (!snap) return;
      const checkpoint: HITLCheckpoint | null = snap.hitlPending ? snap.checkpoint : null;
      const logs = (snap.logs || []).map((log: any, idx: number) => ({
        id: `be-${idx}-${log.timestamp || idx}`,
        timestamp: log.timestamp || '',
        stageId: log.stageId || snap.currentStageId || 1,
        text: log.text,
        level: log.level || 'info',
      }));
      setState((prev) => ({
        ...prev,
        currentStageId: snap.currentStageId || prev.currentStageId,
        stages: snap.stages || prev.stages,
        checkpoint,
        isPaused: snap.status === 'paused',
        isCompleted: snap.status === 'completed',
        streamLogs: logs.length ? logs : prev.streamLogs,
        postingsCounter: snap.totalPostingsIndexed || prev.postingsCounter,
        activePostingsSample: snap.postingsSample || prev.activePostingsSample,
        completedBriefId: snap.briefId || prev.completedBriefId,
      }));
      if (snap.status === 'completed' && snap.briefId && !completedRef.current) {
        completedRef.current = true;
        onComplete?.(snap.briefId);
      }
      if (snap.status === 'failed') {
        setState((prev) => ({
          ...prev,
          streamLogs: [
            ...prev.streamLogs,
            {
              id: `err-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              stageId: snap.currentStageId || 3,
              text: snap.error || 'Research run failed. No substitute report was generated.',
              level: 'hitl',
            },
          ],
        }));
      }
    },
    [onComplete]
  );

  useEffect(() => {
    if (!USE_REAL_BACKEND || !runId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const snap = await apiService.getRunById(runId);
        if (!cancelled) applySnapshot(snap);
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            streamLogs: [
              ...prev.streamLogs,
              {
                id: `poll-err-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                stageId: 1,
                text: err instanceof Error ? err.message : 'Failed to load run state',
                level: 'hitl',
              },
            ],
          }));
        }
      }
    };
    tick();
    const handle = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [runId, applySnapshot]);

  const resolveClarification = useCallback(
    async (answers: Record<string, string>) => {
      const snap = await apiService.resumeRun(runId, { type: 'clarification', answers });
      applySnapshot(snap);
    },
    [runId, applySnapshot]
  );

  const resolveSearchPlanApproval = useCallback(
    async (approvedPlan: SearchPlan) => {
      const snap = await apiService.resumeRun(runId, { type: 'search_plan_approval', plan: approvedPlan });
      applySnapshot(snap);
    },
    [runId, applySnapshot]
  );

  const resolveLowDataDecision = useCallback(
    async (action: 'broaden_radius' | 'add_synonyms' | 'proceed_with_sparse') => {
      const snap = await apiService.resumeRun(runId, { type: 'low_data_decision', action });
      applySnapshot(snap);
    },
    [runId, applySnapshot]
  );

  if (!USE_REAL_BACKEND) {
    return simulation;
  }

  return {
    state,
    resolveClarification,
    resolveSearchPlanApproval,
    resolveLowDataDecision,
    togglePause: () => setState((p) => ({ ...p, isPaused: !p.isPaused })),
    setSpeed: (speed: number) => setState((p) => ({ ...p, speed })),
    fastForwardToFinish: () => undefined,
  };
}
