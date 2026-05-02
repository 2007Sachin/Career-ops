"""
missions.py — Mission lifecycle API

All endpoints require a valid Supabase JWT in the Authorization header.
The user_id is extracted from the token — never trusted from the request body.
"""

from __future__ import annotations

import os
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from gotrue import SyncGoTrueClient
from pydantic import BaseModel, Field
from supabase import create_client, Client

router = APIRouter(prefix="/api/missions", tags=["missions"])

# ── Supabase admin client (service_role — bypasses RLS for writes) ──
_supabase_admin: Client | None = None


def get_supabase_admin() -> Client:
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _supabase_admin


# ── Auth dependency: extract user_id from bearer token ──────────
def get_current_user_id(authorization: str = "") -> UUID:
    """
    Validates the Supabase JWT passed as Bearer token.
    Returns the user's UUID. Raises 401 if invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        admin = get_supabase_admin()
        user_resp = admin.auth.get_user(token)
        if user_resp is None or user_resp.user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return UUID(user_resp.user.id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# ────────────────────────────────────────────────────────────────
# SCHEMAS
# ────────────────────────────────────────────────────────────────

class MissionSummary(BaseModel):
    id: UUID
    job_id: UUID
    company: str
    role: str
    match_score: int
    status: str


class NarrativeChip(BaseModel):
    chip_label: str
    pulse_entry_id: UUID
    proof_url: str | None
    raw_metric: str
    impact_weight: int


class HITLQuestion(BaseModel):
    id: UUID
    field_label: str
    field_type: str
    display_order: int


class MissionDetail(BaseModel):
    id: UUID
    job: dict
    status: str
    match_score: int
    narrative_text: str | None
    narrative_chips: list[NarrativeChip]
    hitl_questions: list[HITLQuestion]


class HITLSubmitRequest(BaseModel):
    responses: dict[str, str] = Field(
        description="Map of question_id (str) → response_text"
    )


class MissionActionRequest(BaseModel):
    action: Literal["approve", "reject", "withdraw"]


# ────────────────────────────────────────────────────────────────
# ENDPOINTS
# ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[MissionSummary])
async def list_missions(
    status_filter: str | None = None,
    authorization: str = "",
):
    """
    GET /api/missions
    Returns all missions for the authenticated candidate.
    Optionally filter by ?status=awaiting_approval
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    query = (
        db.table("missions")
        .select("id, status, match_score, job_id, jobs(title, company)")
        .eq("user_id", str(user_id))
        .order("updated_at", desc=True)
    )

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()

    return [
        MissionSummary(
            id=row["id"],
            job_id=row["job_id"],
            company=row["jobs"]["company"],
            role=row["jobs"]["title"],
            match_score=row["match_score"] or 0,
            status=row["status"],
        )
        for row in (result.data or [])
    ]


@router.get("/{mission_id}", response_model=MissionDetail)
async def get_mission(
    mission_id: UUID,
    authorization: str = "",
):
    """
    GET /api/missions/:id
    Returns full mission detail including narrative chips and HITL questions.
    Only the owning user can access this.
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    result = (
        db.table("missions")
        .select(
            "*, "
            "jobs(id, title, company, domain, salary_raw, description, hard_requirements, soft_requirements), "
            "hitl_questions(id, field_label, field_type, display_order)"
        )
        .eq("id", str(mission_id))
        .eq("user_id", str(user_id))      # RLS enforced in code too
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Mission not found")

    row = result.data
    chips_raw = row.get("narrative_chips") or []

    return MissionDetail(
        id=row["id"],
        job=row["jobs"],
        status=row["status"],
        match_score=row["match_score"] or 0,
        narrative_text=row.get("narrative_text"),
        narrative_chips=[NarrativeChip(**c) for c in chips_raw],
        hitl_questions=sorted(
            [HITLQuestion(**q) for q in row.get("hitl_questions") or []],
            key=lambda q: q.display_order,
        ),
    )


@router.post("/{mission_id}/hitl", status_code=status.HTTP_204_NO_CONTENT)
async def submit_hitl_responses(
    mission_id: UUID,
    body: HITLSubmitRequest,
    authorization: str = "",
):
    """
    POST /api/missions/:id/hitl
    Submit answers to HITL questions for a paused mission.
    Upserts responses then transitions mission → 'resuming' and
    enqueues the outreach agent to continue.
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    # Verify mission belongs to user and is actually paused
    mission = (
        db.table("missions")
        .select("id, status")
        .eq("id", str(mission_id))
        .eq("user_id", str(user_id))
        .single()
        .execute()
    )
    if not mission.data:
        raise HTTPException(status_code=404, detail="Mission not found")
    if mission.data["status"] != "awaiting_approval":
        raise HTTPException(
            status_code=400,
            detail=f"Mission is in '{mission.data['status']}' — only awaiting_approval missions accept HITL responses",
        )

    # Verify all question IDs belong to this mission
    questions = (
        db.table("hitl_questions")
        .select("id")
        .eq("mission_id", str(mission_id))
        .execute()
    )
    valid_ids = {q["id"] for q in (questions.data or [])}
    invalid = set(body.responses.keys()) - valid_ids
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown question IDs: {invalid}")

    # Upsert responses
    rows = [
        {
            "question_id": qid,
            "mission_id": str(mission_id),
            "user_id": str(user_id),
            "response_text": text,
        }
        for qid, text in body.responses.items()
    ]
    db.table("hitl_responses").upsert(rows, on_conflict="question_id,mission_id").execute()

    # Transition to 'resuming' — outreach agent polls this status to continue
    db.table("missions").update({"status": "resuming"}).eq("id", str(mission_id)).execute()

    # Log the event (picked up by frontend terminal widget via Realtime)
    db.table("mission_logs").insert({
        "mission_id": str(mission_id),
        "user_id": str(user_id),
        "log_level": "info",
        "message": "HITL responses submitted. Outreach agent resuming...",
    }).execute()


@router.post("/{mission_id}/action", status_code=status.HTTP_204_NO_CONTENT)
async def mission_action(
    mission_id: UUID,
    body: MissionActionRequest,
    authorization: str = "",
):
    """
    POST /api/missions/:id/action
    body: { "action": "approve" | "reject" | "withdraw" }

    approve  — available when status is 'awaiting_approval' or 'tailoring'
               skips HITL and directly approves the narrative
    reject   — marks mission rejected (user doesn't want to apply)
    withdraw — withdraws a submitted application
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    mission = (
        db.table("missions")
        .select("id, status")
        .eq("id", str(mission_id))
        .eq("user_id", str(user_id))
        .single()
        .execute()
    )
    if not mission.data:
        raise HTTPException(status_code=404, detail="Mission not found")

    current = mission.data["status"]
    allowed: dict[str, list[str]] = {
        "approve":  ["awaiting_approval", "tailoring"],
        "reject":   ["scouting", "tailoring", "awaiting_approval"],
        "withdraw": ["submitted"],
    }

    if current not in allowed.get(body.action, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot '{body.action}' a mission in status '{current}'",
        )

    new_status = {
        "approve":  "resuming",
        "reject":   "rejected",
        "withdraw": "withdrawn",
    }[body.action]

    db.table("missions").update({"status": new_status}).eq("id", str(mission_id)).execute()
    db.table("mission_logs").insert({
        "mission_id": str(mission_id),
        "user_id": str(user_id),
        "log_level": "info" if body.action != "reject" else "warn",
        "message": f"Mission {body.action}d by user.",
    }).execute()
