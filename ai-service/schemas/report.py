from typing import Literal, Optional

from pydantic import BaseModel, Field

from schemas.search_plan import SearchPlan

HiringOutlookVerdict = Literal["Favourable", "Competitive", "Hard to fill"]
ConfidenceLevel = Literal["High", "Medium", "Low"]
CurrencyCode = Literal["USD", "EUR", "GBP", "INR"]


class ConfidenceInsight(BaseModel):
    id: str
    category: Literal["Compensation", "Demand", "Skills", "Competition", "Seniority"]
    claim: str
    confidence: ConfidenceLevel
    confidenceScore: int
    confidenceRationale: str
    evidencePostingCount: int
    evidencePercentage: float
    samplePostingIds: list[str] = Field(default_factory=list)


class MarketBrief(BaseModel):
    id: str
    requestId: str
    role: str
    location: str
    generatedAt: str
    summary: str
    hiringOutlook: dict
    demandVolume: dict
    compensation: dict
    skillsAndRequirements: dict
    employerCompetition: dict
    observedTitles: list[dict]
    confidenceInsights: list[ConfidenceInsight]
    clientRecommendations: dict
    runNotes: dict


class BatchAnalysis(BaseModel):
    posting_id: str
    skills: list[str] = Field(default_factory=list)
    must_have_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    seniority_guess: str = "Unknown"
    years_experience: Optional[float] = None
    employer_type: Literal["Direct", "Staffing"] = "Direct"
    title_normalized: str = ""
