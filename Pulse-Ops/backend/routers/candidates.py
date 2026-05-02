"""
candidates.py — Recruiter-facing candidate API

All endpoints require a recruiter JWT (app_metadata.role == "recruiter").
The org_id is extracted from the JWT — never from the request body.
"""

from __future__ import annotations

import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from .missions import get_supabase_admin, get_current_user_id

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


# ── Auth: must be a recruiter ────────────────────────────────────
def require_recruiter(authorization: str = "") -> tuple[UUID, UUID]:
    """Returns (recruiter_id, org_id) or raises 403."""
    recruiter_id = get_current_user_id(authorization)
    db = get_supabase_admin()
    row = (
        db.table("recruiters")
        .select("id, organization_id")
        .eq("id", str(recruiter_id))
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=403, detail="Recruiter account not found")
    return recruiter_id, UUID(row.data["organization_id"])


# ────────────────────────────────────────────────────────────────
# SCHEMAS
# ────────────────────────────────────────────────────────────────

class CandidateSummary(BaseModel):
    id: UUID
    name: str                         # masked until unlocked
    email: str | None                 # None until contact_unlocked=true
    pulse_score: int
    skill_scores: dict[str, int]      # {FastAPI: 95, PostgreSQL: 88}
    shortlist_status: str | None      # None if never shortlisted by this org
    contact_unlocked: bool


class SkillEntry(BaseModel):
    id: UUID
    raw_metric: str
    proof_url: str | None
    impact_score: int
    occurred_at: str


class SkillAudit(BaseModel):
    skill: str
    confidence: int
    entries: list[SkillEntry]


class CandidateAudit(BaseModel):
    user_id: UUID
    name: str
    email: str | None
    pulse_score: int
    skill_audits: list[SkillAudit]
    contact_unlocked: bool


class ShortlistRequest(BaseModel):
    candidate_id: UUID
    job_id: UUID | None = None
    unlock_contact: bool = False      # if true, deducts 1 credit and unlocks PII


class ShortlistResponse(BaseModel):
    shortlist_id: UUID
    contact_unlocked: bool
    credits_remaining: int
    unlocked_email: str | None


# ────────────────────────────────────────────────────────────────
# ENDPOINTS
# ────────────────────────────────────────────────────────────────

@router.get("/candidates", response_model=list[CandidateSummary])
async def list_candidates(
    skill: str | None = Query(None, description="Filter by skill e.g. 'FastAPI'"),
    min_score: int = Query(0, ge=0, le=100),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    authorization: str = "",
):
    """
    GET /api/recruiter/candidates
    Returns paginated, anonymized candidate list for this recruiter's org.

    Query params:
      skill      — filter by a specific verified skill (PostgreSQL GIN index used)
      min_score  — minimum pulse score (0-100)
      limit/offset — pagination
    """
    recruiter_id, org_id = require_recruiter(authorization)
    db = get_supabase_admin()

    # Build the base query against pulse_scores + users + shortlists
    # The anonymization (name masking) is done in Python to avoid leaking
    # the real name through SQL errors or logs.
    query = (
        db.table("pulse_scores")
        .select(
            "user_id, total, skill_scores, "
            "users!inner(id, full_name, email, onboarded), "
            "shortlists(id, contact_unlocked, status, organization_id)"
        )
        .eq("users.onboarded", True)
        .gte("total", min_score)
        .order("total", desc=True)
        .limit(limit)
        .offset(offset)
    )

    if skill:
        # skill_scores JSONB has key=skill_name, value=confidence
        query = query.not_.is_(f"skill_scores->>{skill}", "null")

    result = query.execute()

    candidates = []
    for row in result.data or []:
        user = row["users"]
        # Find this org's shortlist entry (if any)
        my_shortlist = next(
            (s for s in (row.get("shortlists") or []) if s["organization_id"] == str(org_id)),
            None,
        )
        unlocked = my_shortlist.get("contact_unlocked", False) if my_shortlist else False

        full_name: str = user["full_name"] or "Unknown"
        masked_name = _mask_name(full_name) if not unlocked else full_name

        candidates.append(CandidateSummary(
            id=row["user_id"],
            name=masked_name,
            email=user["email"] if unlocked else None,
            pulse_score=row["total"],
            skill_scores=row["skill_scores"] or {},
            shortlist_status=my_shortlist["status"] if my_shortlist else None,
            contact_unlocked=unlocked,
        ))

    return candidates


@router.get("/candidates/{candidate_id}/audit", response_model=CandidateAudit)
async def get_candidate_audit(
    candidate_id: UUID,
    authorization: str = "",
):
    """
    GET /api/recruiter/candidates/:id/audit
    Returns full evidence audit for a candidate.
    Skill entries (proof URLs, raw metrics) require contact_unlocked=true
    to resolve — otherwise proof_url is redacted.
    """
    recruiter_id, org_id = require_recruiter(authorization)
    db = get_supabase_admin()

    # Check unlock status for this org
    shortlist = (
        db.table("shortlists")
        .select("contact_unlocked")
        .eq("user_id", str(candidate_id))
        .eq("organization_id", str(org_id))
        .maybe_single()
        .execute()
    )
    unlocked = (shortlist.data or {}).get("contact_unlocked", False)

    # Fetch user basic info
    user_row = (
        db.table("users")
        .select("full_name, email")
        .eq("id", str(candidate_id))
        .eq("onboarded", True)
        .single()
        .execute()
    )
    if not user_row.data:
        raise HTTPException(status_code=404, detail="Candidate not found")

    full_name = user_row.data["full_name"] or "Unknown"

    # Fetch pulse score + skill_scores
    score_row = (
        db.table("pulse_scores")
        .select("total, skill_scores")
        .eq("user_id", str(candidate_id))
        .single()
        .execute()
    )
    skill_scores: dict[str, int] = (score_row.data or {}).get("skill_scores", {})

    # Fetch top entries per skill
    entries_result = (
        db.table("pulse_entries")
        .select("id, tags, raw_metric, proof_url, impact_score, occurred_at")
        .eq("user_id", str(candidate_id))
        .order("impact_score", desc=True)
        .limit(50)
        .execute()
    )
    entries = entries_result.data or []

    # Build skill_audits: group entries by their highest-scoring tag
    skill_audits = []
    for skill, confidence in sorted(skill_scores.items(), key=lambda x: -x[1])[:6]:
        skill_entries = [e for e in entries if skill in (e.get("tags") or [])][:5]
        skill_audits.append(SkillAudit(
            skill=skill,
            confidence=confidence,
            entries=[
                SkillEntry(
                    id=e["id"],
                    raw_metric=e["raw_metric"],
                    # Redact proof URL until contact is unlocked
                    proof_url=e["proof_url"] if unlocked else None,
                    impact_score=e["impact_score"] or 0,
                    occurred_at=e["occurred_at"],
                )
                for e in skill_entries
            ],
        ))

    return CandidateAudit(
        user_id=candidate_id,
        name=full_name if unlocked else _mask_name(full_name),
        email=user_row.data["email"] if unlocked else None,
        pulse_score=(score_row.data or {}).get("total", 0),
        skill_audits=skill_audits,
        contact_unlocked=unlocked,
    )


@router.post("/shortlist", response_model=ShortlistResponse)
async def shortlist_candidate(
    body: ShortlistRequest,
    authorization: str = "",
):
    """
    POST /api/recruiter/shortlist
    Shortlist a candidate, optionally unlocking their contact details.

    If unlock_contact=true:
      - Checks org has >= 1 credit
      - Deducts 1 credit (credit_transactions ledger)
      - Sets shortlist.contact_unlocked = true
    """
    recruiter_id, org_id = require_recruiter(authorization)
    db = get_supabase_admin()

    # Verify candidate exists and is onboarded
    cand = (
        db.table("users")
        .select("id")
        .eq("id", str(body.candidate_id))
        .eq("onboarded", True)
        .maybe_single()
        .execute()
    )
    if not cand.data:
        raise HTTPException(status_code=404, detail="Candidate not found or not onboarded")

    credits_remaining = 0

    if body.unlock_contact:
        # Check credits
        org = (
            db.table("organizations")
            .select("unlock_credits")
            .eq("id", str(org_id))
            .single()
            .execute()
        )
        credits_remaining = org.data["unlock_credits"]
        if credits_remaining < 1:
            raise HTTPException(
                status_code=402,
                detail="Insufficient unlock credits. Purchase more credits to continue.",
            )

    # Upsert shortlist row
    shortlist_data = {
        "recruiter_id": str(recruiter_id),
        "organization_id": str(org_id),
        "user_id": str(body.candidate_id),
        "job_id": str(body.job_id) if body.job_id else None,
        "status": "shortlisted",
    }
    if body.unlock_contact:
        shortlist_data["contact_unlocked"] = True
        shortlist_data["unlocked_at"] = "now()"

    result = (
        db.table("shortlists")
        .upsert(shortlist_data, on_conflict="recruiter_id,user_id,job_id")
        .select("id, contact_unlocked")
        .execute()
    )
    shortlist_row = result.data[0]

    if body.unlock_contact:
        # Deduct credit — atomic via two writes (acceptable; use a DB function for strict atomicity)
        db.table("organizations").update(
            {"unlock_credits": credits_remaining - 1}
        ).eq("id", str(org_id)).execute()

        db.table("credit_transactions").insert({
            "organization_id": str(org_id),
            "recruiter_id": str(recruiter_id),
            "shortlist_id": shortlist_row["id"],
            "delta": -1,
            "reason": "contact_unlock",
        }).execute()

        # Notify the candidate
        db.table("notifications").insert({
            "user_id": str(body.candidate_id),
            "type": "shortlisted",
            "payload": {"org_id": str(org_id)},
        }).execute()

        credits_remaining -= 1

    # Fetch unlocked email if applicable
    unlocked_email = None
    if shortlist_row["contact_unlocked"]:
        user = db.table("users").select("email").eq("id", str(body.candidate_id)).single().execute()
        unlocked_email = user.data["email"]

    return ShortlistResponse(
        shortlist_id=UUID(shortlist_row["id"]),
        contact_unlocked=shortlist_row["contact_unlocked"],
        credits_remaining=credits_remaining,
        unlocked_email=unlocked_email,
    )


# ────────────────────────────────────────────────────────────────
# HELPERS
# ────────────────────────────────────────────────────────────────

def _mask_name(full_name: str) -> str:
    """'Arjun Mehta' → 'Arjun M.'"""
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0]
    return parts[0] + " " + parts[-1][0] + "."
