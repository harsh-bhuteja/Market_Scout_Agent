import React, { useState } from 'react';
import { ClarificationModal } from '../components/hitl/ClarificationModal';
import { SearchPlanModal } from '../components/hitl/SearchPlanModal';
import { LowDataModal } from '../components/hitl/LowDataModal';
import { SearchPlan, ClarificationQuestion } from '../types';
import { UserCheck, CheckCircle2, Sliders, AlertTriangle, HelpCircle } from 'lucide-react';

export const HITLSandboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clarification' | 'plan' | 'low_data'>('clarification');
  const [lastAction, setLastAction] = useState<string | null>(null);

  const sampleQuestions: ClarificationQuestion[] = [
    {
      id: 'q1',
      question: 'Which engineering track does your client need?',
      context: 'The role "Engineer" is ambiguous across disciplines with widely varying salary bands.',
      suggestedAnswers: [
        'Software / Backend Engineering (Distributed Systems)',
        'Machine Learning / AI Research',
        'DevOps / Site Reliability Engineering',
        'Data Platform Engineering',
      ],
    },
    {
      id: 'q2',
      question: 'Confirm preferred geography & commute tolerance:',
      context: 'Target was given as "Texas" which covers multiple non-contiguous tech clusters.',
      suggestedAnswers: [
        'Austin Metropolitan Area (Hybrid / 30 mi radius)',
        'Dallas - Fort Worth Metroplex',
        'State-wide Remote (Texas resident required)',
      ],
    },
  ];

  const sampleSearchPlan: SearchPlan = {
    roleQuery: 'Software Engineer',
    titleSynonyms: [
      'Software Engineer',
      'Backend Software Engineer',
      'Distributed Systems Engineer',
      'Full Stack Developer',
    ],
    locationScope: 'Austin, Texas',
    radiusKm: 40,
    dateRangeDays: 30,
    targetPostingsCount: 250,
    keywords: ['Python', 'Go', 'AWS', 'PostgreSQL', 'Docker'],
    negativeKeywords: ['Internship', 'Data Entry', 'Civil', 'Mechanical'],
  };

  const handleClarificationSubmit = (answers: Record<string, string>) => {
    setLastAction(`Clarification submitted: ${JSON.stringify(answers, null, 2)}`);
  };

  const handlePlanApprove = (plan: SearchPlan) => {
    setLastAction(`Search plan approved: ${plan.titleSynonyms.length} synonyms, ${plan.radiusKm}km radius, target ${plan.targetPostingsCount} postings.`);
  };

  const handleLowDataDecision = (action: string) => {
    setLastAction(`Low data decision applied: "${action}". Graph resumed.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <UserCheck className="w-4 h-4 text-white" />
          <span>LANGGRAPH INTERRUPT() PLAYGROUND</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Human-in-the-Loop Interaction Lab
        </h1>
        <p className="text-sm text-zinc-300">
          Test and evaluate the 3 stateful human checkpoints required by the Joveo Assessment PRD.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-white/10 shadow-gloss-reflection">
        <button
          type="button"
          onClick={() => setActiveTab('clarification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'clarification'
              ? 'bg-white text-black shadow-glow-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Step 2: Clarification Questions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'plan'
              ? 'bg-white text-black shadow-glow-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Step 3: Search-Plan Approval</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('low_data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'low_data'
              ? 'bg-white text-black shadow-glow-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Step 4: Low-Data Checkpoint</span>
        </button>
      </div>

      {/* Active Component Container */}
      <div className="space-y-6">
        {activeTab === 'clarification' && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400 font-mono">
              Simulating StateGraph node `clarify_with_user` after ambiguous input evaluation:
            </div>
            <ClarificationModal
              questions={sampleQuestions}
              onSubmit={handleClarificationSubmit}
            />
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400 font-mono">
              Simulating StateGraph node `plan_the_search` awaiting operator authorization:
            </div>
            <SearchPlanModal
              initialPlan={sampleSearchPlan}
              onApprove={handlePlanApprove}
            />
          </div>
        )}

        {activeTab === 'low_data' && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400 font-mono">
              Simulating StateGraph node `gather_postings` sufficiency loop limit reached (18/150 postings):
            </div>
            <LowDataModal
              currentCount={18}
              targetCount={150}
              onDecision={handleLowDataDecision}
            />
          </div>
        )}

        {/* Live Action Inspector */}
        {lastAction && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-white/20 flex items-start gap-3 text-xs shadow-gloss-reflection">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono text-white font-bold">Checkpoint State Updated:</span>
              <pre className="font-mono text-zinc-300 whitespace-pre-wrap text-[11px]">
                {lastAction}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
