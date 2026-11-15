import React, { useState } from 'react';
import { ClarificationQuestion } from '../../types';
import { HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ClarificationModalProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onCancel?: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  questions,
  onSubmit,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    questions.forEach((q) => {
      init[q.id] = q.suggestedAnswers[0] || '';
    });
    return init;
  });

  const handleSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleCustomChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-6 border border-white/20 relative overflow-hidden">
      {/* Glossy top reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 text-white shrink-0 shadow-gloss-reflection">
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
              STEP 2 · HITL CHECKPOINT
            </span>
            <span className="text-xs text-zinc-400 font-mono">Agent Paused at interrupt()</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Request Clarification Required
          </h3>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            The agent detected that your hiring request is ambiguous. Answering these targeted questions will ensure precise search queries and prevent noisy talent data.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-white font-bold">0{idx + 1}.</span>
              <label className="text-sm font-semibold text-zinc-200">
                {q.question}
              </label>
            </div>
            {q.context && (
              <p className="text-xs text-zinc-400 italic pl-6">{q.context}</p>
            )}

            {/* Suggested Answers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-1">
              {q.suggestedAnswers.map((option) => {
                const isSelected = answers[q.id] === option;
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handleSelect(q.id, option)}
                    className={`text-left p-3 rounded-lg text-xs transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-white/15 border-white/40 text-white shadow-gloss-reflection font-medium'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Answer Input */}
            <div className="pl-6 pt-1">
              <input
                type="text"
                placeholder="Or type custom specification..."
                value={answers[q.id] || ''}
                onChange={(e) => handleCustomChange(q.id, e.target.value)}
                className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-ping"></span>
            Resuming updates LangGraph state on active thread
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-glow-white border border-white/20 transition-all hover:scale-[1.01]"
          >
            <span>Resume Graph Execution</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
