import { useState, useEffect, useRef, useCallback } from 'react';
import { HiringRequest, WorkflowStage, HITLCheckpoint, MarketBrief, SearchPlan } from '../types';
import { WORKFLOW_STAGES_CONFIG, SAMPLE_REPORTS } from '../mocks/sampleReports';
import { apiService } from '../services/api';

export interface SimulationState {
  currentStageId: number;
  stages: WorkflowStage[];
  checkpoint: HITLCheckpoint | null;
  isPaused: boolean;
  isCompleted: boolean;
  speed: number; // 1, 2, 4
  streamLogs: Array<{ id: string; timestamp: string; stageId: number; text: string; level: 'info' | 'agent' | 'tool' | 'hitl' | 'success' }>;
  postingsCounter: number;
  activePostingsSample: Array<{ id: string; title: string; company: string; location: string; salary?: string }>;
  completedBriefId: string | null;
}

export function useResearchSimulation(
  runId: string,
  request: HiringRequest | null,
  onComplete?: (briefId: string) => void
) {
  const initialStages: WorkflowStage[] = WORKFLOW_STAGES_CONFIG.map((c) => ({
    id: c.id as any,
    name: c.name,
    title: c.title,
    description: c.description,
    status: c.id === 1 ? 'active' : 'pending',
    progressPercent: 0,
    logs: [],
  }));

  const [state, setState] = useState<SimulationState>({
    currentStageId: 1,
    stages: initialStages,
    checkpoint: null,
    isPaused: false,
    isCompleted: false,
    speed: 1,
    streamLogs: [
      {
        id: 'log-0',
        timestamp: new Date().toLocaleTimeString(),
        stageId: 1,
        text: `Intake node initialized for role: "${request?.role || 'Data Analyst'}" in "${request?.location || 'Bangalore'}".`,
        level: 'agent',
      },
    ],
    postingsCounter: 0,
    activePostingsSample: [],
    completedBriefId: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((stageId: number, text: string, level: 'info' | 'agent' | 'tool' | 'hitl' | 'success' = 'info') => {
    setState((prev) => ({
      ...prev,
      streamLogs: [
        ...prev.streamLogs,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          stageId,
          text,
          level,
        },
      ],
    }));
  }, []);

  const setStageProgress = useCallback((stageId: number, progress: number, status: WorkflowStage['status']) => {
    setState((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              progressPercent: progress,
              status,
              startedAt: s.startedAt || new Date().toISOString(),
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            }
          : s
      ),
    }));
  }, []);

  // Main simulation tick loop
  useEffect(() => {
    if (state.checkpoint || state.isPaused || state.isCompleted) return;

    const baseDelay = 1200 / state.speed;

    timerRef.current = setTimeout(() => {
      const { currentStageId, stages } = state;
      const currentStage = stages.find((s) => s.id === currentStageId);
      const currentProgress = currentStage?.progressPercent || 0;

      // STAGE 1: Intake & Clarity Check
      if (currentStageId === 1) {
        if (currentProgress < 50) {
          setStageProgress(1, 50, 'active');
          addLog(1, 'Evaluating query ambiguity against vector taxonomy...', 'agent');
        } else if (currentProgress < 100) {
          // Check if role is ambiguous (e.g. single word like 'Engineer' or user specifically requested HITL)
          const isAmbiguous = request?.role.trim().toLowerCase() === 'engineer' || request?.location.toLowerCase() === 'texas';
          if (isAmbiguous && !currentStage?.meta?.clarified) {
            // Trigger Stage 1 HITL Clarification Checkpoint
            setStageProgress(1, 80, 'paused');
            addLog(1, 'Ambiguity detected: "Engineer" role requires specialization boundary check.', 'hitl');
            setState((prev) => ({
              ...prev,
              checkpoint: {
                id: 'cp-clarify-1',
                stageId: 1,
                type: 'clarification',
                title: 'Human-in-the-Loop: Ambiguity Resolution Needed',
                description: 'The search query "Engineer" covers multiple engineering tracks and geographies. Please clarify to improve precision.',
                timestamp: new Date().toLocaleTimeString(),
                clarificationQuestions: [
                  {
                    id: 'q1',
                    question: 'Which specific engineering track should this scout prioritize?',
                    context: 'Different engineering fields have completely distinct salary ranges and skill profiles.',
                    suggestedAnswers: [
                      'Backend Software Engineering (Distributed Systems)',
                      'Machine Learning / AI Engineering',
                      'DevOps & Cloud Infrastructure',
                      'Full Stack Web Engineering',
                    ],
                  },
                  {
                    id: 'q2',
                    question: 'Confirm target geographical scope and work mode:',
                    context: 'Helps balance local commuter vs remote talent pool.',
                    suggestedAnswers: [
                      'Austin Metro (Hybrid / On-site within 35 miles)',
                      'State-wide Remote (Texas residents)',
                      'Nationwide Remote (US timezone)',
                    ],
                  },
                ],
              },
            }));
            return;
          }

          setStageProgress(1, 100, 'completed');
          addLog(1, '✓ Role and location parameters verified clear. Proceeding to search plan.', 'success');
          setState((prev) => ({ ...prev, currentStageId: 2 }));
        }
      }

      // STAGE 2: Search Strategy & Plan Approval
      else if (currentStageId === 2) {
        if (currentProgress < 40) {
          setStageProgress(2, 40, 'active');
          addLog(2, `Formulating title synonyms for "${request?.role || 'Software Engineer'}"...`, 'agent');
        } else if (currentProgress < 80) {
          setStageProgress(2, 80, 'active');
          addLog(2, 'Drafting boolean search plan: keywords, exclusion filters, geographic radius.', 'tool');
        } else if (currentProgress < 100) {
          // If search plan hasn't been approved yet by human, pause for HITL approval
          if (!currentStage?.meta?.planApproved) {
            setStageProgress(2, 85, 'paused');
            addLog(2, 'Checkpoint: Pausing for Search-Plan Approval before firing external API credits.', 'hitl');
            setState((prev) => ({
              ...prev,
              checkpoint: {
                id: 'cp-plan-approval',
                stageId: 2,
                type: 'search_plan_approval',
                title: 'Human-in-the-Loop: Search Plan Review & Sign-Off',
                description: 'Verify and refine the automated search parameters before calling job board APIs.',
                timestamp: new Date().toLocaleTimeString(),
                searchPlanDraft: {
                  roleQuery: request?.role || 'Data Analyst',
                  titleSynonyms: [
                    request?.role || 'Data Analyst',
                    `Senior ${request?.role || 'Data Analyst'}`,
                    'Business Intelligence Analyst',
                    'Analytics Engineer',
                  ],
                  locationScope: `${request?.location || 'Bangalore'} (Metropolitan Radius)`,
                  radiusKm: 35,
                  dateRangeDays: 30,
                  targetPostingsCount: 200,
                  keywords: ['SQL', 'Python', 'Analytics', 'Reporting', 'Data Warehousing'],
                  negativeKeywords: ['Internship', 'Data Entry', 'Administrative Assistant', 'BPO'],
                },
              },
            }));
            return;
          }

          setStageProgress(2, 100, 'completed');
          addLog(2, '✓ Search plan approved by operator. Transitioning to API gather node.', 'success');
          setState((prev) => ({ ...prev, currentStageId: 3 }));
        }
      }

      // STAGE 3: Fetching Postings & Deduplication
      else if (currentStageId === 3) {
        if (currentProgress < 30) {
          setStageProgress(3, 30, 'active');
          addLog(3, 'Tool invocation: adzuna_job_search(country="in/us", query=titles, radius=35km)', 'tool');
          setState((prev) => ({ ...prev, postingsCounter: 68 }));
        } else if (currentProgress < 70) {
          setStageProgress(3, 70, 'active');
          addLog(3, 'Fetched 240 raw postings. Running fuzzy deduplication and cross-board hash match...', 'tool');
          setState((prev) => ({
            ...prev,
            postingsCounter: 184,
            activePostingsSample: [
              { id: 'adz-101', title: `${request?.role || 'Data Analyst'}`, company: 'Enterprise GCC', location: request?.location || 'Bangalore', salary: '$120k-$140k' },
              { id: 'adz-102', title: `Lead ${request?.role || 'Data Analyst'}`, company: 'Fintech Unicorn', location: request?.location || 'Bangalore', salary: '$140k-$165k' },
              { id: 'adz-103', title: `Staff Specialist`, company: 'Global Cloud Systems', location: request?.location || 'Bangalore' },
            ],
          }));
        } else if (currentProgress < 100) {
          setStageProgress(3, 100, 'completed');
          addLog(3, '✓ Sufficiency threshold passed: 184 unique high-quality postings validated.', 'success');
          setState((prev) => ({ ...prev, currentStageId: 4 }));
        }
      }

      // STAGE 4: Parallel LLM Batch Analysis (Map-Reduce)
      else if (currentStageId === 4) {
        if (currentProgress < 35) {
          setStageProgress(4, 35, 'active');
          addLog(4, 'Splitting 184 postings into 6 micro-batches (LangGraph Send API map-reduce)...', 'agent');
        } else if (currentProgress < 70) {
          setStageProgress(4, 70, 'active');
          addLog(4, 'Batch 1-3 parsed: normalising salary periods (hourly/monthly -> annual) and extracting required tools.', 'agent');
        } else if (currentProgress < 100) {
          setStageProgress(4, 100, 'completed');
          addLog(4, '✓ Map-reduce reducer completed: aggregated skills dictionary and seniority spectrum.', 'success');
          setState((prev) => ({ ...prev, currentStageId: 5 }));
        }
      }

      // STAGE 5: Evidence Synthesis & Confidence Scoring
      else if (currentStageId === 5) {
        if (currentProgress < 50) {
          setStageProgress(5, 50, 'active');
          addLog(5, 'Computing median, 25th, and 75th percentiles with outliner trimming (IQR)...', 'agent');
        } else if (currentProgress < 100) {
          setStageProgress(5, 100, 'completed');
          addLog(5, '✓ Generated confidence badges (3 High, 1 Medium) backed by posting ID citations.', 'success');
          setState((prev) => ({ ...prev, currentStageId: 6 }));
        }
      }

      // STAGE 6: Market Brief Generation
      else if (currentStageId === 6) {
        if (currentProgress < 60) {
          setStageProgress(6, 60, 'active');
          addLog(6, 'Pydantic model validation: constructing structured client brief and hiring outlook verdict...', 'agent');
        } else if (currentProgress < 100) {
          setStageProgress(6, 100, 'completed');
          addLog(6, '✓ Final Talent Market Brief successfully generated and verified against schema.', 'success');

          // Select matching mock report or generate tailored brief
          const sampleKey =
            request?.role.toLowerCase().includes('ai') || request?.role.toLowerCase().includes('ml')
              ? 'report-ai-research-sf'
              : request?.location.toLowerCase().includes('texas') || request?.role.toLowerCase().includes('software')
              ? 'report-software-eng-texas'
              : 'report-data-analyst-blr';

          const generatedBrief: MarketBrief = {
            ...SAMPLE_REPORTS[sampleKey],
            id: `brief-${Date.now()}`,
            requestId: runId,
            role: request?.role || SAMPLE_REPORTS[sampleKey].role,
            location: request?.location || SAMPLE_REPORTS[sampleKey].location,
            generatedAt: new Date().toISOString(),
          };

          apiService.saveBrief(generatedBrief);

          setState((prev) => ({
            ...prev,
            isCompleted: true,
            completedBriefId: generatedBrief.id,
          }));

          if (onComplete) {
            onComplete(generatedBrief.id);
          }
        }
      }
    }, baseDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, request, runId, onComplete, addLog, setStageProgress]);

  // Checkpoint resolution handlers
  const resolveClarification = useCallback((answers: Record<string, string>) => {
    addLog(1, `Clarification received: ${Object.values(answers).join(' | ')}. Resuming graph execution...`, 'agent');
    setState((prev) => ({
      ...prev,
      checkpoint: null,
      stages: prev.stages.map((s) => (s.id === 1 ? { ...s, meta: { clarified: true, answers } } : s)),
    }));
  }, [addLog]);

  const resolveSearchPlanApproval = useCallback((approvedPlan: SearchPlan) => {
    addLog(2, `Search plan confirmed: ${approvedPlan.titleSynonyms.length} title variations, ${approvedPlan.radiusKm}km radius. Resuming fetch...`, 'agent');
    setState((prev) => ({
      ...prev,
      checkpoint: null,
      stages: prev.stages.map((s) => (s.id === 2 ? { ...s, meta: { planApproved: true, approvedPlan } } : s)),
    }));
  }, [addLog]);

  const resolveLowDataDecision = useCallback((action: 'broaden_radius' | 'add_synonyms' | 'proceed_with_sparse') => {
    addLog(3, `Operator decision on sparse data: "${action}". Updating state graph...`, 'agent');
    setState((prev) => ({
      ...prev,
      checkpoint: null,
    }));
  }, [addLog]);

  const togglePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  const fastForwardToFinish = useCallback(() => {
    // Instantly complete all remaining stages
    const sampleKey =
      request?.role.toLowerCase().includes('ai') || request?.role.toLowerCase().includes('ml')
        ? 'report-ai-research-sf'
        : request?.location.toLowerCase().includes('texas') || request?.role.toLowerCase().includes('software')
        ? 'report-software-eng-texas'
        : 'report-data-analyst-blr';

    const generatedBrief: MarketBrief = {
      ...SAMPLE_REPORTS[sampleKey],
      id: `brief-${Date.now()}`,
      requestId: runId,
      role: request?.role || SAMPLE_REPORTS[sampleKey].role,
      location: request?.location || SAMPLE_REPORTS[sampleKey].location,
      generatedAt: new Date().toISOString(),
    };

    apiService.saveBrief(generatedBrief);

    setState((prev) => ({
      ...prev,
      currentStageId: 6,
      checkpoint: null,
      isPaused: false,
      isCompleted: true,
      completedBriefId: generatedBrief.id,
      stages: prev.stages.map((s) => ({ ...s, status: 'completed', progressPercent: 100 })),
      postingsCounter: generatedBrief.demandVolume.sampleAnalyzed,
      streamLogs: [
        ...prev.streamLogs,
        {
          id: `log-ff-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          stageId: 6,
          text: '⚡ Fast-forward executed: Generated complete verified market brief.',
          level: 'success',
        },
      ],
    }));

    if (onComplete) {
      onComplete(generatedBrief.id);
    }
  }, [request, runId, onComplete]);

  return {
    state,
    resolveClarification,
    resolveSearchPlanApproval,
    resolveLowDataDecision,
    togglePause,
    setSpeed,
    fastForwardToFinish,
  };
}

