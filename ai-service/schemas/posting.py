from typing import Any, Optional

from pydantic import BaseModel, Field


class JobPosting(BaseModel):
    id: str
    source: str = "adzuna"
    source_id: str
    title: str
    company: str = ""
    location: str = ""
    description: str = ""
    created: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_is_predicted: Optional[bool] = None
    currency: Optional[str] = None
    contract_time: Optional[str] = None
    contract_type: Optional[str] = None
    category: Optional[str] = None
    redirect_url: Optional[str] = None
    raw: dict[str, Any] = Field(default_factory=dict)
