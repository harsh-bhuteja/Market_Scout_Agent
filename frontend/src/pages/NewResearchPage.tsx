import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResearchStore } from '../hooks/useResearchStore';
import { HiringRequest, SeniorityLevel, WorkplaceType, EmploymentType, CurrencyCode } from '../types';
import { 
  Cpu, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

export const NewResearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createRun } = useResearchStore();

  const [formData, setFormData] = useState({
    role: searchParams.get('role') || 'Data Analyst',
    location: searchParams.get('location') || 'Bangalore, India',
    experienceRange: '3-5 years',
    industry: 'Technology & Enterprise SaaS',
    seniority: 'Mid-Level' as SeniorityLevel,
    workplaceType: 'Hybrid' as WorkplaceType,
    employmentType: 'Full-time' as EmploymentType,
    currency: (searchParams.get('currency') || 'INR') as CurrencyCode,
    clientPurpose: 'Need accurate salary benchmarking and candidate skill priorities for client pitch deck.',
    focusSalary: true,
    focusSkills: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const locParam = searchParams.get('location');
    const currParam = searchParams.get('currency') as CurrencyCode;
    if (roleParam) setFormData((prev) => ({ ...prev, role: roleParam }));
    if (locParam) setFormData((prev) => ({ ...prev, location: locParam }));
    if (currParam) setFormData((prev) => ({ ...prev, currency: currParam }));
  }, [searchParams]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.role.trim()) {
      errs.role = 'Role or job title is required';
    }
    if (!formData.location.trim()) {
      errs.location = 'Target geography or metro is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const request: HiringRequest = {
      id: `req-${Date.now()}`,
      role: formData.role.trim(),
      location: formData.location.trim(),
      experienceRange: formData.experienceRange,
      industry: formData.industry,
      seniority: formData.seniority,
      workplaceType: formData.workplaceType,
      employmentType: formData.employmentType,
      currency: formData.currency,
      clientPurpose: formData.clientPurpose,
      focusAreas: [
        ...(formData.focusSalary ? ['salary'] : []),
        ...(formData.focusSkills ? ['skills'] : []),
      ],
      createdAt: new Date().toISOString(),
    };

    try {
      const runId = await createRun(request);
      navigate(`/workflow?runId=${runId}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleTestAmbiguous = () => {
    setFormData((prev) => ({
      ...prev,
      role: 'Engineer',
      location: 'Texas',
      currency: 'USD',
      clientPurpose: 'Ambiguous test case to observe Step 2 Human-in-the-Loop clarification pause.',
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Cpu className="w-4 h-4 text-white" />
          <span>GRAPH INTAKE NODE · STEP 1</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Configure Talent Market Scout
        </h1>
        <p className="text-sm text-zinc-300">
          Initialize a stateful LangGraph agent run. The agent will assess query clarity, draft search strategies, and pause if clarification or plan approval is required.
        </p>
      </div>

      {/* Preset shortcut banner */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-gloss-reflection">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Sparkles className="w-4 h-4 text-white" />
          <span>Want to test the Human-in-the-Loop clarification checkpoint?</span>
        </div>
        <button
          type="button"
          onClick={handleTestAmbiguous}
          className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
        >
          Load Ambiguous "Engineer, Texas" Case
        </button>
      </div>

      {/* Main Setup Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel-glow rounded-3xl p-6 lg:p-8 border border-white/[0.12] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field 1: Role */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>Job Role or Title *</span>
                <span className="text-[11px] text-zinc-400 font-normal">e.g. Data Analyst</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Senior AI Research Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-4 py-3 bg-zinc-950 rounded-xl border text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                    errors.role ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-white/40'
                  }`}
                />
                <Briefcase className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3.5" />
              </div>
              {errors.role && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* Field 2: Target Location */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>Target Geography / Metro *</span>
                <span className="text-[11px] text-zinc-400 font-normal">e.g. Bangalore, SF</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Bangalore, India or Austin, TX"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full px-4 py-3 bg-zinc-950 rounded-xl border text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                    errors.location ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-white/40'
                  }`}
                />
                <MapPin className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3.5" />
              </div>
              {errors.location && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Field 3: Seniority */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Seniority Level
              </label>
              <select
                value={formData.seniority}
                onChange={(e) => setFormData({ ...formData, seniority: e.target.value as SeniorityLevel })}
                className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-white/10 text-sm text-white focus:outline-none focus:border-white/40"
              >
                <option value="Junior">Junior (0-2 years)</option>
                <option value="Mid-Level">Mid-Level (3-5 years)</option>
                <option value="Senior">Senior (5-8 years)</option>
                <option value="Staff/Lead">Staff / Principal (8+ years)</option>
                <option value="Any">Any Seniority Spectrum</option>
              </select>
            </div>

            {/* Field 4: Currency */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Benchmark Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-white/10 text-sm text-white focus:outline-none focus:border-white/40"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ United States Dollar)</option>
                <option value="GBP">GBP (£ British Pound)</option>
                <option value="EUR">EUR (€ Euro)</option>
              </select>
            </div>

            {/* Field 5: Workplace Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Workplace Mode
              </label>
              <select
                value={formData.workplaceType}
                onChange={(e) => setFormData({ ...formData, workplaceType: e.target.value as WorkplaceType })}
                className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-white/10 text-sm text-white focus:outline-none focus:border-white/40"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Any">Any Work Model</option>
              </select>
            </div>
          </div>

          {/* Field 6: Client Purpose & Requirements */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span>Hiring Context & Client Objectives</span>
              <span className="text-[11px] text-zinc-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Hiring for a fintech seed-stage startup. Needs strong experience in dbt, Postgres, and real-time event streaming."
              value={formData.clientPurpose}
              onChange={(e) => setFormData({ ...formData, clientPurpose: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 leading-relaxed"
            />
          </div>

          {/* Configuration Flags */}
          <div className="pt-2 border-t border-white/[0.08] space-y-3">
            <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider block">
              Execution Optimization Flags
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={formData.focusSalary}
                  onChange={(e) => setFormData({ ...formData, focusSalary: e.target.checked })}
                  className="rounded bg-black border-white/30 text-white focus:ring-0"
                />
                <span className="font-mono text-white">--focus salary</span>
                <span className="text-zinc-500">(normalizes IQR compensation bands)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={formData.focusSkills}
                  onChange={(e) => setFormData({ ...formData, focusSkills: e.target.checked })}
                  className="rounded bg-black border-white/30 text-white focus:ring-0"
                />
                <span className="font-mono text-white">--focus skills</span>
                <span className="text-zinc-500">(extracts mandatory vs nice-to-have)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-zinc-400 font-mono">
            Output: <span className="text-white">Structured Brief JSON & Markdown</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-glow-white border border-white/20 transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            <span>Start Market Scout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
