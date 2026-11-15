export type SeniorityLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Staff/Lead' | 'Director' | 'Any';
export type WorkplaceType = 'Remote' | 'Hybrid' | 'On-site' | 'Any';
export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time' | 'Any';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR';

export type HiringOutlookVerdict = 'Favourable' | 'Competitive' | 'Hard to fill';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface HiringRequest {
  id: string;
  role: string;
  location: string;
  experienceRange: string;
  industry: string;
  seniority: SeniorityLevel;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  currency: CurrencyCode;
  clientPurpose: string;
  focusAreas: string[];
  createdAt: string;
}

export interface SearchPlan {
  roleQuery: string;
  titleSynonyms: string[];
  locationScope: string;
  radiusKm: number;
  dateRangeDays: number;
  targetPostingsCount: number;
  keywords: string[];
  negativeKeywords: string[];
}

export type StageId = 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkflowStage {
  id: StageId;
  name: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'failed';
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
  logs: string[];
  meta?: Record<string, any>;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  context: string;
  suggestedAnswers: string[];
  userAnswer?: string;
}

export interface HITLCheckpoint {
  id: string;
  stageId: StageId;
  type: 'clarification' | 'search_plan_approval' | 'low_data_decision';
  title: string;
  description: string;
  timestamp: string;
  clarificationQuestions?: ClarificationQuestion[];
  searchPlanDraft?: SearchPlan;
  lowDataDecision?: {
    currentCount: number;
    targetCount: number;
    attemptsMade: number;
    maxAttempts: number;
    reason: string;
    options: Array<{
      id: string;
      title: string;
      description: string;
      actionType: 'broaden_radius' | 'add_synonyms' | 'proceed_with_sparse';
    }>;
  };
}

export interface ConfidenceInsight {
  id: string;
  category: 'Compensation' | 'Demand' | 'Skills' | 'Competition' | 'Seniority';
  claim: string;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
  confidenceRationale: string;
  evidencePostingCount: number;
  evidencePercentage: number;
  samplePostingIds: string[];
}

export interface PostingEvidenceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryText?: string;
  source: string;
  postedAgo: string;
}

export interface MarketBrief {
  id: string;
  requestId: string;
  role: string;
  location: string;
  generatedAt: string;
  summary: string;
  hiringOutlook: {
    verdict: HiringOutlookVerdict;
    reason: string;
    metricSummary: string;
  };
  demandVolume: {
    totalActivePostings: number;
    sampleAnalyzed: number;
    trend30Day: number; // e.g. +14%
    averagePostingAgeDays: number;
    volumeTimeline: Array<{ month: string; volume: number }>;
  };
  compensation: {
    currency: CurrencyCode;
    medianSalary: number;
    percentile25: number;
    percentile75: number;
    salaryMin: number;
    salaryMax: number;
    disclosedPayPercentage: number;
    distributionBands: Array<{ band: string; count: number; percentage: number }>;
    seniorityBreakdown: Array<{ level: string; median: number; min: number; max: number }>;
  };
  skillsAndRequirements: {
    mustHaveSkills: Array<{ name: string; frequency: number; percentage: number }>;
    niceToHaveSkills: Array<{ name: string; frequency: number; percentage: number }>;
    typicalYearsExperience: number;
    experienceDistribution: Array<{ bracket: string; percentage: number }>;
  };
  employerCompetition: {
    topEmployers: Array<{ name: string; openPositions: number; marketSharePercent: number; type: 'Direct' | 'Staffing' }>;
    agencyVsDirect: {
      directPercent: number;
      agencyPercent: number;
    };
  };
  observedTitles: Array<{ title: string; count: number; sharePercent: number }>;
  confidenceInsights: ConfidenceInsight[];
  clientRecommendations: {
    suggestedJobTitle: string;
    recommendedSalaryBand: {
      min: number;
      max: number;
      target: number;
      currency: CurrencyCode;
      rationale: string;
    };
    leadSkills: string[];
    jobDescriptionHook: string;
    strategicTakeaway: string;
  };
  runNotes: {
    questionsAndAnswers: Array<{ question: string; answer: string }>;
    finalSearchPlan: SearchPlan;
    postingsFetched: number;
    postingsDeduplicated: number;
    postingsAnalyzed: number;
    dedupedDuplicatesCount: number;
    executionTimeSeconds: number;
    assumptionsMade: string[];
    dataSource: string;
  };
}

export interface ResearchRun {
  id: string;
  role: string;
  location: string;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'paused' | 'failed';
  currentStageId: StageId;
  hiringOutlook?: HiringOutlookVerdict;
  totalPostingsIndexed?: number;
  salaryMedian?: number;
  currency?: CurrencyCode;
  briefId?: string;
  hitlPending?: boolean;
}

