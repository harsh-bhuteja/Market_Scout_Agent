import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResearchStore } from '../hooks/useResearchStore';
import { MarketBrief } from '../types';
import { SAMPLE_REPORTS } from '../mocks/sampleReports';
import { ReportHeader } from '../components/report/ReportHeader';
import { OverviewMetrics } from '../components/report/OverviewMetrics';
import { CompensationCharts } from '../components/report/CompensationCharts';
import { SkillsSection } from '../components/report/SkillsSection';
import { EmployerSection } from '../components/report/EmployerSection';
import { ConfidenceInsightsList } from '../components/report/ConfidenceInsightsList';
import { ClientRecommendationsCard } from '../components/report/ClientRecommendationsCard';
import { RunNotesAudit } from '../components/report/RunNotesAudit';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getBrief } = useResearchStore();
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const targetId = id || 'report-data-analyst-blr';
      let found = await getBrief(targetId);
      if (!found && targetId.startsWith('report-')) {
        found = SAMPLE_REPORTS[targetId];
      }
      setBrief(found || null);
      setLoading(false);
    }
    load();
  }, [id, getBrief]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-zinc-400">Loading structured market brief...</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Market Brief Not Found</h2>
        <p className="text-xs text-zinc-400">The requested intelligence report could not be retrieved.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Back button & report switcher breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Center</span>
        </Link>

        {/* Sample report switchers */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-zinc-500">View other samples:</span>
          <Link
            to="/report/report-data-analyst-blr"
            className={`px-2 py-1 rounded text-[11px] border ${
              brief.id === 'report-data-analyst-blr'
                ? 'bg-white/15 text-white border-white/30 font-medium shadow-gloss-reflection'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white'
            }`}
          >
            Data Analyst (Bangalore)
          </Link>
          <Link
            to="/report/report-ai-research-sf"
            className={`px-2 py-1 rounded text-[11px] border ${
              brief.id === 'report-ai-research-sf'
                ? 'bg-white/15 text-white border-white/30 font-medium shadow-gloss-reflection'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white'
            }`}
          >
            AI Scientist (SF)
          </Link>
          <Link
            to="/report/report-software-eng-texas"
            className={`px-2 py-1 rounded text-[11px] border ${
              brief.id === 'report-software-eng-texas'
                ? 'bg-white/15 text-white border-white/30 font-medium shadow-gloss-reflection'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white'
            }`}
          >
            Software Eng (Austin)
          </Link>
        </div>
      </div>

      {/* Flagship Header with Hiring Outlook */}
      <ReportHeader brief={brief} />

      {/* Overview Metrics Cards */}
      <OverviewMetrics brief={brief} />

      {/* CSM Client Recommendations Card */}
      <ClientRecommendationsCard brief={brief} />

      {/* Compensation Distributions & Seniority Benchmarks */}
      <CompensationCharts brief={brief} />

      {/* Technical Skills & Experience Spectrum */}
      <SkillsSection brief={brief} />

      {/* Top Employers & Real Title Variants */}
      <EmployerSection brief={brief} />

      {/* Evidence-Backed Confidence Insights with Posting Citations */}
      <ConfidenceInsightsList brief={brief} />

      {/* Run Notes, Deduplication Stats & Model Audit */}
      <RunNotesAudit brief={brief} />
    </div>
  );
};
