import { MarketBrief, ResearchRun, HITLCheckpoint } from '../types';

export const SAMPLE_REPORTS: Record<string, MarketBrief> = {
  'report-data-analyst-blr': {
    id: 'report-data-analyst-blr',
    requestId: 'req-001',
    role: 'Data Analyst',
    location: 'Bangalore, India',
    generatedAt: '2026-11-04T18:30:00Z',
    summary: 'The Bangalore data analytics talent landscape is highly active and favourable for employers. Strong supply from tech services and analytics consulting firms keeps median compensation competitive, though top-tier talent with dbt and cloud data warehouse capabilities commands a 28% premium.',
    hiringOutlook: {
      verdict: 'Favourable',
      reason: 'Deep talent pipeline in Bengaluru with high posting turnover and stable salary expectations.',
      metricSummary: '1,420 Active Postings · ₹12.5L Median CTC · 14.2 Candidates/Opening'
    },
    demandVolume: {
      totalActivePostings: 1420,
      sampleAnalyzed: 184,
      trend30Day: 8.5,
      averagePostingAgeDays: 14,
      volumeTimeline: [
        { month: 'Jun', volume: 1120 },
        { month: 'Jul', volume: 1190 },
        { month: 'Aug', volume: 1280 },
        { month: 'Sep', volume: 1340 },
        { month: 'Oct', volume: 1420 },
      ]
    },
    compensation: {
      currency: 'INR',
      medianSalary: 1250000,
      percentile25: 850000,
      percentile75: 1800000,
      salaryMin: 600000,
      salaryMax: 2800000,
      disclosedPayPercentage: 64,
      distributionBands: [
        { band: '₹6L - ₹9L', count: 48, percentage: 26 },
        { band: '₹9L - ₹14L', count: 72, percentage: 39 },
        { band: '₹14L - ₹20L', count: 44, percentage: 24 },
        { band: '₹20L - ₹28L', count: 20, percentage: 11 },
      ],
      seniorityBreakdown: [
        { level: 'Junior (1-3 yrs)', median: 750000, min: 550000, max: 950000 },
        { level: 'Mid-Level (3-5 yrs)', median: 1250000, min: 900000, max: 1650000 },
        { level: 'Senior (5-8 yrs)', median: 1950000, min: 1600000, max: 2500000 },
        { level: 'Lead (8+ yrs)', median: 2750000, min: 2200000, max: 3600000 },
      ]
    },
    skillsAndRequirements: {
      mustHaveSkills: [
        { name: 'SQL', frequency: 168, percentage: 91 },
        { name: 'Python', frequency: 142, percentage: 77 },
        { name: 'Power BI', frequency: 118, percentage: 64 },
        { name: 'Tableau', frequency: 96, percentage: 52 },
        { name: 'Excel / Advanced Modeling', frequency: 92, percentage: 50 },
      ],
      niceToHaveSkills: [
        { name: 'dbt (data build tool)', frequency: 46, percentage: 25 },
        { name: 'Snowflake', frequency: 55, percentage: 30 },
        { name: 'BigQuery', frequency: 39, percentage: 21 },
        { name: 'Airflow', frequency: 31, percentage: 17 },
      ],
      typicalYearsExperience: 3.8,
      experienceDistribution: [
        { bracket: '0-2 years', percentage: 22 },
        { bracket: '3-5 years', percentage: 48 },
        { bracket: '6-8 years', percentage: 23 },
        { bracket: '8+ years', percentage: 7 },
      ]
    },
    employerCompetition: {
      topEmployers: [
        { name: 'Flipkart', openPositions: 24, marketSharePercent: 13, type: 'Direct' },
        { name: 'Swiggy', openPositions: 18, marketSharePercent: 10, type: 'Direct' },
        { name: 'Mu Sigma Analytics', openPositions: 16, marketSharePercent: 9, type: 'Staffing' },
        { name: 'Infosys BPM', openPositions: 14, marketSharePercent: 8, type: 'Staffing' },
        { name: 'PhonePe', openPositions: 12, marketSharePercent: 7, type: 'Direct' },
      ],
      agencyVsDirect: {
        directPercent: 68,
        agencyPercent: 32,
      }
    },
    observedTitles: [
      { title: 'Data Analyst', count: 98, sharePercent: 53 },
      { title: 'Business Intelligence Analyst', count: 42, sharePercent: 23 },
      { title: 'Product Analytics Specialist', count: 26, sharePercent: 14 },
      { title: 'Quantitative Data Analyst', count: 18, sharePercent: 10 },
    ],
    confidenceInsights: [
      {
        id: 'conf-1',
        category: 'Compensation',
        claim: 'Mid-level Data Analysts in Bangalore with SQL + Python normalize around ₹12L - ₹14L CTC.',
        confidence: 'High',
        confidenceScore: 94,
        confidenceRationale: 'Derived from 118 active postings with explicit salary disclosure in Bangalore IT corridor.',
        evidencePostingCount: 118,
        evidencePercentage: 64,
        samplePostingIds: ['adz-in-8821', 'adz-in-8845', 'adz-in-8910', 'adz-in-9022']
      },
      {
        id: 'conf-2',
        category: 'Skills',
        claim: 'SQL is effectively a mandatory gatekeeper, appearing in 91% of validated job specs.',
        confidence: 'High',
        confidenceScore: 98,
        confidenceRationale: 'Unanimous presence across startups, product GCCs, and IT service providers.',
        evidencePostingCount: 168,
        evidencePercentage: 91,
        samplePostingIds: ['adz-in-8821', 'adz-in-8829', 'adz-in-8874']
      },
      {
        id: 'conf-3',
        category: 'Demand',
        claim: 'Product firms offer 35% higher compensation than legacy IT consulting firms for analytics roles.',
        confidence: 'Medium',
        confidenceScore: 78,
        confidenceRationale: 'Clear divergence observed in CTC bands, but bonus and equity components are not fully disclosed.',
        evidencePostingCount: 42,
        evidencePercentage: 23,
        samplePostingIds: ['adz-in-8901', 'adz-in-8955']
      }
    ],
    clientRecommendations: {
      suggestedJobTitle: 'Product Data Analyst (SQL & Python)',
      recommendedSalaryBand: {
        min: 1100000,
        max: 1550000,
        target: 1300000,
        currency: 'INR',
        rationale: 'Positioning at ₹13.0L lands at the 58th percentile, attracting strong GCC and startup performers while avoiding the tier-1 tech price tag.'
      },
      leadSkills: ['SQL', 'Python (Pandas/NumPy)', 'Tableau or Power BI', 'Data Modeling'],
      jobDescriptionHook: 'Lead product metrics and user journey experimentation for high-scale digital platforms in Bangalore.',
      strategicTakeaway: 'Lead the job description with product impact and SQL/Python rather than generic Excel reporting to filter for modern analytics profiles.'
    },
    runNotes: {
      questionsAndAnswers: [],
      finalSearchPlan: {
        roleQuery: 'Data Analyst',
        titleSynonyms: ['Data Analyst', 'BI Analyst', 'Product Analyst', 'Analytics Engineer'],
        locationScope: 'Bangalore, Karnataka, India',
        radiusKm: 35,
        dateRangeDays: 30,
        targetPostingsCount: 200,
        keywords: ['SQL', 'Python', 'Analytics', 'BI'],
        negativeKeywords: ['Internship', 'Data Entry', 'Lead Generation']
      },
      postingsFetched: 240,
      postingsDeduplicated: 184,
      postingsAnalyzed: 184,
      dedupedDuplicatesCount: 56,
      executionTimeSeconds: 12.4,
      assumptionsMade: [
        'Query was clear and unambiguous; skipped human clarification pause (Step 2).',
        'Normalized all hourly/monthly contract disclosures to standard Annual CTC.',
        'Grouped duplicate cross-posted positions on Adzuna and LinkedIn.'
      ],
      dataSource: 'Adzuna Jobs API (India) & Normalized Multi-Source Aggregator'
    }
  },

  'report-ai-research-sf': {
    id: 'report-ai-research-sf',
    requestId: 'req-002',
    role: 'Senior AI/ML Research Engineer',
    location: 'San Francisco, CA',
    generatedAt: '2026-11-04T19:15:00Z',
    summary: 'The San Francisco AI/ML research talent market is exceptionally tight and classified as Hard to Fill. Generative AI and Foundation Model startups backed by top venture capital are driving unprecedented competition, pushing median base salaries to $195k with substantial equity grants.',
    hiringOutlook: {
      verdict: 'Hard to fill',
      reason: 'Extreme competition from well-funded AI labs and hyperscalers; talent pool is highly selective and expects remote flexibility or high-equity upside.',
      metricSummary: '890 Active Postings · $195,000 Median Base · 3.1 Candidates/Opening'
    },
    demandVolume: {
      totalActivePostings: 890,
      sampleAnalyzed: 236,
      trend30Day: 24.2,
      averagePostingAgeDays: 29,
      volumeTimeline: [
        { month: 'Jun', volume: 620 },
        { month: 'Jul', volume: 690 },
        { month: 'Aug', volume: 760 },
        { month: 'Sep', volume: 820 },
        { month: 'Oct', volume: 890 },
      ]
    },
    compensation: {
      currency: 'USD',
      medianSalary: 195000,
      percentile25: 170000,
      percentile75: 235000,
      salaryMin: 145000,
      salaryMax: 320000,
      disclosedPayPercentage: 88,
      distributionBands: [
        { band: '$140k - $170k', count: 32, percentage: 14 },
        { band: '$170k - $200k', count: 104, percentage: 44 },
        { band: '$200k - $240k', count: 68, percentage: 29 },
        { band: '$240k+', count: 32, percentage: 13 },
      ],
      seniorityBreakdown: [
        { level: 'Mid AI Engineer (3-5 yrs)', median: 165000, min: 140000, max: 185000 },
        { level: 'Senior AI/ML (5-8 yrs)', median: 195000, min: 170000, max: 235000 },
        { level: 'Staff/Principal (8+ yrs)', median: 250000, min: 215000, max: 320000 },
      ]
    },
    skillsAndRequirements: {
      mustHaveSkills: [
        { name: 'PyTorch', frequency: 220, percentage: 93 },
        { name: 'LLM Fine-Tuning / LoRA', frequency: 198, percentage: 84 },
        { name: 'Distributed Training (vLLM / Megatron)', frequency: 165, percentage: 70 },
        { name: 'Python', frequency: 232, percentage: 98 },
        { name: 'Vector DBs / RAG', frequency: 154, percentage: 65 },
      ],
      niceToHaveSkills: [
        { name: 'CUDA / C++ Kernels', frequency: 94, percentage: 40 },
        { name: 'Triton', frequency: 78, percentage: 33 },
        { name: 'LangGraph / LangChain', frequency: 92, percentage: 39 },
      ],
      typicalYearsExperience: 5.4,
      experienceDistribution: [
        { bracket: '2-4 years', percentage: 12 },
        { bracket: '5-7 years', percentage: 56 },
        { bracket: '8+ years', percentage: 32 },
      ]
    },
    employerCompetition: {
      topEmployers: [
        { name: 'Anthropic & Affiliates', openPositions: 19, marketSharePercent: 8, type: 'Direct' },
        { name: 'OpenAI Ecosystem Co.', openPositions: 16, marketSharePercent: 7, type: 'Direct' },
        { name: 'Scale AI', openPositions: 14, marketSharePercent: 6, type: 'Direct' },
        { name: 'Turing (Staffing)', openPositions: 15, marketSharePercent: 6, type: 'Staffing' },
        { name: 'Databricks', openPositions: 11, marketSharePercent: 5, type: 'Direct' },
      ],
      agencyVsDirect: {
        directPercent: 79,
        agencyPercent: 21,
      }
    },
    observedTitles: [
      { title: 'Senior AI/ML Research Engineer', count: 112, sharePercent: 47 },
      { title: 'Senior Machine Learning Engineer (LLMs)', count: 74, sharePercent: 31 },
      { title: 'Staff Applied Scientist', count: 32, sharePercent: 14 },
      { title: 'Foundation Model Engineer', count: 18, sharePercent: 8 },
    ],
    confidenceInsights: [
      {
        id: 'conf-sf-1',
        category: 'Compensation',
        claim: 'CA pay transparency law provides exceptionally reliable salary evidence (88% compliance).',
        confidence: 'High',
        confidenceScore: 96,
        confidenceRationale: '208 out of 236 postings contain explicit statutory base pay disclosures.',
        evidencePostingCount: 208,
        evidencePercentage: 88,
        samplePostingIds: ['adz-us-1021', 'adz-us-1049', 'adz-us-1188']
      },
      {
        id: 'conf-sf-2',
        category: 'Demand',
        claim: 'Time-to-fill for senior LLM practitioners exceeds 62 days on average in SF metro.',
        confidence: 'Medium',
        confidenceScore: 82,
        confidenceRationale: 'Tracking re-posting cadence across 60 days shows repeated recruitment cycles.',
        evidencePostingCount: 74,
        evidencePercentage: 31,
        samplePostingIds: ['adz-us-1002', 'adz-us-1234']
      }
    ],
    clientRecommendations: {
      suggestedJobTitle: 'Senior AI Research Engineer (LLM Architecture & Distributed Training)',
      recommendedSalaryBand: {
        min: 185000,
        max: 225000,
        target: 205000,
        currency: 'USD',
        rationale: 'Posting at or slightly above $200k base is mandatory to clear initial candidate filtering in the SF Bay Area.'
      },
      leadSkills: ['PyTorch', 'Distributed Training (vLLM / DeepSpeed)', 'LLM Evaluation & Alignment'],
      jobDescriptionHook: 'Work with frontier model clusters on proprietary reasoning pipelines in Downtown San Francisco.',
      strategicTakeaway: 'Emphasize cluster compute availability (e.g. H100 GPU quota) directly in the JD intro; research engineers optimize for compute access above marginal base pay differences.'
    },
    runNotes: {
      questionsAndAnswers: [
        { question: 'Is this role focused on Applied ML engineering or core generative foundation research?', answer: 'Generative foundation models & inference optimization.' }
      ],
      finalSearchPlan: {
        roleQuery: 'Senior AI Research Engineer',
        titleSynonyms: ['AI Research Scientist', 'Senior ML Engineer', 'Foundation Model Engineer'],
        locationScope: 'San Francisco, CA (50km radius)',
        radiusKm: 50,
        dateRangeDays: 45,
        targetPostingsCount: 300,
        keywords: ['PyTorch', 'LLM', 'Inference', 'Distributed'],
        negativeKeywords: ['Web Developer', 'DevOps', 'Sales Engineer']
      },
      postingsFetched: 320,
      postingsDeduplicated: 236,
      postingsAnalyzed: 236,
      dedupedDuplicatesCount: 84,
      executionTimeSeconds: 18.2,
      assumptionsMade: [
        'User answered clarifying question on foundation research focus.',
        'Excluded pure data science / BI analyst listings during filtering.'
      ],
      dataSource: 'Adzuna Jobs API (US) & Direct Tech Aggregator'
    }
  },

  'report-software-eng-texas': {
    id: 'report-software-eng-texas',
    requestId: 'req-003',
    role: 'Software Engineer',
    location: 'Austin, Texas',
    generatedAt: '2026-11-04T17:10:00Z',
    summary: 'Austin tech hub maintains a balanced, competitive environment for backend & full-stack software engineers. Influx of enterprise tech campuses and remote relocations has normalized median mid-to-senior software engineering base salaries at $145,000.',
    hiringOutlook: {
      verdict: 'Competitive',
      reason: 'Active competition among enterprise SaaS, fintech and silicon hardware firms, but substantial candidate volume.',
      metricSummary: '2,140 Active Postings · $145,000 Median Base · 8.4 Candidates/Opening'
    },
    demandVolume: {
      totalActivePostings: 2140,
      sampleAnalyzed: 215,
      trend30Day: 5.2,
      averagePostingAgeDays: 18,
      volumeTimeline: [
        { month: 'Jun', volume: 1820 },
        { month: 'Jul', volume: 1910 },
        { month: 'Aug', volume: 1980 },
        { month: 'Sep', volume: 2060 },
        { month: 'Oct', volume: 2140 },
      ]
    },
    compensation: {
      currency: 'USD',
      medianSalary: 145000,
      percentile25: 120000,
      percentile75: 172000,
      salaryMin: 95000,
      salaryMax: 215000,
      disclosedPayPercentage: 58,
      distributionBands: [
        { band: '$95k - $120k', count: 42, percentage: 20 },
        { band: '$120k - $150k', count: 96, percentage: 45 },
        { band: '$150k - $180k', count: 52, percentage: 24 },
        { band: '$180k+', count: 25, percentage: 11 },
      ],
      seniorityBreakdown: [
        { level: 'Associate (1-3 yrs)', median: 105000, min: 90000, max: 120000 },
        { level: 'Mid-Level (3-5 yrs)', median: 140000, min: 120000, max: 160000 },
        { level: 'Senior (5-8 yrs)', median: 168000, min: 145000, max: 195000 },
        { level: 'Staff Engineer', median: 198000, min: 175000, max: 230000 },
      ]
    },
    skillsAndRequirements: {
      mustHaveSkills: [
        { name: 'Python or Go', frequency: 178, percentage: 83 },
        { name: 'Cloud Architecture (AWS / GCP)', frequency: 162, percentage: 75 },
        { name: 'PostgreSQL', frequency: 148, percentage: 69 },
        { name: 'Kubernetes / Docker', frequency: 138, percentage: 64 },
      ],
      niceToHaveSkills: [
        { name: 'Kafka', frequency: 72, percentage: 33 },
        { name: 'GraphQL', frequency: 54, percentage: 25 },
        { name: 'Terraform', frequency: 65, percentage: 30 },
      ],
      typicalYearsExperience: 4.6,
      experienceDistribution: [
        { bracket: '1-3 years', percentage: 24 },
        { bracket: '4-6 years', percentage: 46 },
        { bracket: '7+ years', percentage: 30 },
      ]
    },
    employerCompetition: {
      topEmployers: [
        { name: 'Dell Technologies', openPositions: 32, marketSharePercent: 15, type: 'Direct' },
        { name: 'Oracle Austin', openPositions: 26, marketSharePercent: 12, type: 'Direct' },
        { name: 'Apex Systems', openPositions: 22, marketSharePercent: 10, type: 'Staffing' },
        { name: 'Indeed (Austin HQ)', openPositions: 18, marketSharePercent: 8, type: 'Direct' },
      ],
      agencyVsDirect: {
        directPercent: 71,
        agencyPercent: 29,
      }
    },
    observedTitles: [
      { title: 'Software Engineer', count: 95, sharePercent: 44 },
      { title: 'Backend Software Engineer', count: 62, sharePercent: 29 },
      { title: 'Full Stack Engineer', count: 38, sharePercent: 18 },
      { title: 'Cloud Software Engineer', count: 20, sharePercent: 9 },
    ],
    confidenceInsights: [
      {
        id: 'conf-tx-1',
        category: 'Compensation',
        claim: 'Austin tech salaries remain 18-22% below SF Bay Area equivalents, offering notable arbitrage.',
        confidence: 'High',
        confidenceScore: 92,
        confidenceRationale: 'Cross-indexed against 215 verified postings and regional cost of living indices.',
        evidencePostingCount: 145,
        evidencePercentage: 67,
        samplePostingIds: ['adz-tx-402', 'adz-tx-419', 'adz-tx-488']
      }
    ],
    clientRecommendations: {
      suggestedJobTitle: 'Backend Software Engineer (Distributed Systems)',
      recommendedSalaryBand: {
        min: 135000,
        max: 160000,
        target: 148000,
        currency: 'USD',
        rationale: '$148k median base is competitive against local tech giants like Dell and Oracle.'
      },
      leadSkills: ['Python/Go', 'AWS Microservices', 'PostgreSQL'],
      jobDescriptionHook: 'Scale high-throughput distributed microservices in the Silicon Hills of Austin.',
      strategicTakeaway: 'Highlight no state income tax benefits and modern stack autonomy in ad headline.'
    },
    runNotes: {
      questionsAndAnswers: [
        { question: 'Role was submitted as "Engineer, Texas". Which engineering discipline?', answer: 'Software / Backend Engineering.' },
        { question: 'Which metro area in Texas is preferred?', answer: 'Austin metro (or hybrid within 50 miles).' }
      ],
      finalSearchPlan: {
        roleQuery: 'Software Engineer Backend',
        titleSynonyms: ['Software Developer', 'Backend Engineer', 'Full Stack Developer'],
        locationScope: 'Austin, Texas',
        radiusKm: 60,
        dateRangeDays: 30,
        targetPostingsCount: 250,
        keywords: ['Python', 'Go', 'Cloud', 'SQL'],
        negativeKeywords: ['Civil', 'Mechanical', 'Chemical']
      },
      postingsFetched: 280,
      postingsDeduplicated: 215,
      postingsAnalyzed: 215,
      dedupedDuplicatesCount: 65,
      executionTimeSeconds: 14.8,
      assumptionsMade: [
        'Triggered Step 2 Human Clarification pause because original input "Engineer, Texas" was highly ambiguous.',
        'Resumed with user response targeting Austin and Software Backend domain.'
      ],
      dataSource: 'Adzuna Jobs API (US - Texas Region)'
    }
  }
};

export const INITIAL_RESEARCH_RUNS: ResearchRun[] = [
  {
    id: 'run-001',
    role: 'Data Analyst',
    location: 'Bangalore, India',
    createdAt: '2026-11-04T18:30:00Z',
    status: 'completed',
    currentStageId: 6,
    hiringOutlook: 'Favourable',
    totalPostingsIndexed: 1420,
    salaryMedian: 1250000,
    currency: 'INR',
    briefId: 'report-data-analyst-blr',
  },
  {
    id: 'run-002',
    role: 'Senior AI/ML Research Engineer',
    location: 'San Francisco, CA',
    createdAt: '2026-11-04T19:15:00Z',
    status: 'completed',
    currentStageId: 6,
    hiringOutlook: 'Hard to fill',
    totalPostingsIndexed: 890,
    salaryMedian: 195000,
    currency: 'USD',
    briefId: 'report-ai-research-sf',
  },
  {
    id: 'run-003',
    role: 'Software Engineer',
    location: 'Austin, Texas',
    createdAt: '2026-11-04T17:10:00Z',
    status: 'completed',
    currentStageId: 6,
    hiringOutlook: 'Competitive',
    totalPostingsIndexed: 2140,
    salaryMedian: 145000,
    currency: 'USD',
    briefId: 'report-software-eng-texas',
  },
];

export const WORKFLOW_STAGES_CONFIG = [
  {
    id: 1,
    name: 'intake_and_clarity',
    title: '1. Intake & Requirements Clarification',
    description: 'Graph analyzes hiring prompt specificity, evaluates ambiguity thresholds, and triggers clarifying questions if required.',
  },
  {
    id: 2,
    name: 'search_planning',
    title: '2. Search Strategy & Plan Approval',
    description: 'Constructs title synonyms, geographic radius, date windows, keyword filters, and presents plan for human sign-off.',
  },
  {
    id: 3,
    name: 'gathering_postings',
    title: '3. Real Job Postings Gathering & Deduplication',
    description: 'Executes public jobs API tool calls, paginates records, deduplicates cross-listed ads, and evaluates volume sufficiency.',
  },
  {
    id: 4,
    name: 'parallel_analysis',
    title: '4. Parallel LLM Batch Analysis (Map-Reduce)',
    description: 'Splits postings into batches, executes parallel extraction of compensation, normalized skills, and employer classifications.',
  },
  {
    id: 5,
    name: 'evidence_synthesis',
    title: '5. Evidence Synthesis & Confidence Scoring',
    description: 'Computes median & interquartile compensation, tags insights with High/Medium/Low confidence, and links posting citations.',
  },
  {
    id: 6,
    name: 'market_brief_generation',
    title: '6. Structured Market Brief Generation',
    description: 'Assembles typed Pydantic brief schema with client recommendations, hiring outlook verdict, and audit run notes.',
  },
];

