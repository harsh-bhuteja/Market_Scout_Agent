import React, { useState } from 'react';
import { MarketBrief } from '../../types';
import { getOutlookBadgeProps, generateMarkdownReport, downloadFile } from '../../utils/formatters';
import { 
  FileText, 
  FileCode, 
  Check, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Share2 
} from 'lucide-react';

export const ReportHeader: React.FC<{ brief: MarketBrief }> = ({ brief }) => {
  const [copied, setCopied] = useState(false);
  const outlook = getOutlookBadgeProps(brief.hiringOutlook.verdict);

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport(brief);
    const filename = `market-brief-${brief.role.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    downloadFile(md, filename, 'text/markdown;charset=utf-8');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(brief, null, 2);
    const filename = `market-brief-${brief.role.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    downloadFile(jsonStr, filename, 'application/json;charset=utf-8');
  };

  const handleCopyBrief = () => {
    const md = generateMarkdownReport(brief);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel-glow rounded-3xl p-6 lg:p-8 border border-white/[0.12] relative overflow-hidden space-y-6">
      {/* Ambient background reflection */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Top Meta & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 flex items-center gap-1.5 shadow-gloss-reflection">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            EVIDENCE-BACKED TALENT BRIEF
          </span>
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(brief.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </span>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyBrief}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-medium text-zinc-300 transition-colors shadow-gloss-reflection"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Brief' : 'Copy Brief'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-medium text-white transition-colors shadow-gloss-reflection"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-300" />
            <span>Export Markdown</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black border border-white/30 rounded-xl text-xs font-bold transition-all shadow-glow-white active:scale-95"
          >
            <FileCode className="w-3.5 h-3.5 text-black" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Hero Headline & Outlook Verdict Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
            <MapPin className="w-4 h-4 text-white" />
            <span>{brief.location}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {brief.role}
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed pt-1">
            {brief.summary}
          </p>
        </div>

        {/* Outlook Hero Badge */}
        <div className={`p-5 rounded-2xl border ${outlook.border} ${outlook.bg} ${outlook.glow} space-y-2 shadow-gloss-reflection`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Hiring Outlook Verdict
            </span>
            <ShieldCheck className={`w-4 h-4 ${outlook.color}`} />
          </div>
          <div className={`text-2xl font-black ${outlook.color} tracking-tight`}>
            {outlook.title}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {brief.hiringOutlook.reason}
          </p>
          <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-zinc-400">
            {brief.hiringOutlook.metricSummary}
          </div>
        </div>
      </div>
    </div>
  );
};
