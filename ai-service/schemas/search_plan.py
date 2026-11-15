from pydantic import BaseModel, Field


class SearchPlan(BaseModel):
    roleQuery: str
    titleSynonyms: list[str] = Field(default_factory=list)
    locationScope: str
    radiusKm: int = 35
    dateRangeDays: int = 30
    targetPostingsCount: int = 200
    keywords: list[str] = Field(default_factory=list)
    negativeKeywords: list[str] = Field(default_factory=list)
