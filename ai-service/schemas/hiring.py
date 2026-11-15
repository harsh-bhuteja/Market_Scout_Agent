from typing import Literal

from pydantic import BaseModel, Field

SeniorityLevel = Literal["Junior", "Mid-Level", "Senior", "Staff/Lead", "Director", "Any"]
WorkplaceType = Literal["Remote", "Hybrid", "On-site", "Any"]
EmploymentType = Literal["Full-time", "Contract", "Part-time", "Any"]
CurrencyCode = Literal["USD", "EUR", "GBP", "INR"]


class HiringRequest(BaseModel):
    id: str = ""
    role: str
    location: str
    experienceRange: str = ""
    industry: str = ""
    seniority: SeniorityLevel = "Any"
    workplaceType: WorkplaceType = "Any"
    employmentType: EmploymentType = "Any"
    currency: CurrencyCode = "USD"
    clientPurpose: str = ""
    focusAreas: list[str] = Field(default_factory=list)
    createdAt: str = ""
