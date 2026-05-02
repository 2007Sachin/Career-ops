import re
from datetime import datetime
from typing import Literal, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, model_validator


class PulseEntry(BaseModel):
    id: UUID
    platform: Literal["github", "supabase", "leetcode", "n8n_webhook"]
    occurred_at: datetime
    raw_metric: str
    proof_url: HttpUrl
    tags: List[str]                        # was: inferred_skill (single str)
    impact_score: int = Field(ge=1, le=10) # was: impact_weight


class JobSchema(BaseModel):
    job_title: str
    company_name: str
    source_url: Optional[HttpUrl] = None
    hard_requirements: List[str]
    soft_requirements: List[str]
    salary_range: Optional[str] = None
    location: Optional[str] = None
    domain: Optional[str] = None


class JobMatchSchema(BaseModel):
    job_title: str
    company_name: str
    overall_match_score: int = Field(ge=0, le=100)
    justification_narrative: str
    verified_evidence_links: List[HttpUrl]

    @model_validator(mode="after")
    def validate_justification_narrative(self) -> "JobMatchSchema":
        narrative = self.justification_narrative

        # Check max 2 sentences (approximate by counting punctuation)
        sentences = [s for s in re.split(r'[.!?]+', narrative) if s.strip()]
        if len(sentences) > 2:
            raise ValueError("justification_narrative must be max 2 sentences")

        cited = any(str(url) in narrative for url in self.verified_evidence_links)
        if not cited:
            raise ValueError("justification_narrative must contain at least one proof_url reference")

        return self


class MissionState(BaseModel):
    mission_id: UUID
    status: Literal["scouting", "tailoring", "awaiting_approval", "submitted", "failed"]
    hitl_pending_questions: Optional[List[str]] = None


class MissionParameters(BaseModel):
    target_roles: List[str]
    target_domains: List[str]
    target_companies: List[str]
    min_salary_lpa: int              # was: min_salary
    location_preference: str
