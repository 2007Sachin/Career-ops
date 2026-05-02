"""
pulse.py — Pulse Score API

GET  /api/pulse                  → current user's full score breakdown
GET  /api/pulse/entries          → paginated raw activity log
POST /api/pulse/sync             → trigger on-demand ingestion for a platform
"""

from __future__ import annotations

import os
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from pydantic import BaseModel

from .missions import get_supabase_admin, get_current_user_id

router = APIRouter(prefix="/api/pulse", tags=["pulse"])


# ── SCHEMAS ──────────────────────────────────────────────────────

class PulseScoreResponse(BaseModel):
    user_id: UUID
    total: int                          # 0-100
    recency: int                        # 0-40
    diversity: int                      # 0-30
    consistency: int                    # 0-30
    sparkline: list[int]                # last 7 daily totals
    skill_scores: dict[str, int]        # {FastAPI: 95, ...}
    computed_at: str


class PulseEntry(BaseModel):
    id: UUID
    platform: str
    entry_type: str
    raw_metric: str
    proof_url: str | None
    impact_score: int
    tags: list[str]
    occurred_at: str


class SyncRequest(BaseModel):
    platform: str                       # 'github' | 'leetcode' | 'supabase'


class SyncResponse(BaseModel):
    run_id: UUID
    status: str                         # 'running'
    message: str


# ── ENDPOINTS ────────────────────────────────────────────────────

@router.get("", response_model=PulseScoreResponse)
async def get_pulse_score(authorization: str = ""):
    """
    GET /api/pulse
    Returns the authenticated user's current Pulse Score breakdown.
    The sparkline array contains the last 7 daily total scores.
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    row = (
        db.table("pulse_scores")
        .select("*")
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    if not row.data:
        # Score not yet computed (e.g. right after onboarding)
        return PulseScoreResponse(
            user_id=user_id,
            total=0, recency=0, diversity=0, consistency=0,
            sparkline=[], skill_scores={}, computed_at="",
        )

    data = row.data
    return PulseScoreResponse(
        user_id=data["user_id"],
        total=data["total"],
        recency=data["recency"],
        diversity=data["diversity"],
        consistency=data["consistency"],
        sparkline=data["sparkline"] or [],
        skill_scores=data["skill_scores"] or {},
        computed_at=data["computed_at"],
    )


@router.get("/entries", response_model=list[PulseEntry])
async def list_pulse_entries(
    platform: str | None = Query(None),
    tag: str | None = Query(None, description="Filter by skill tag e.g. 'FastAPI'"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    authorization: str = "",
):
    """
    GET /api/pulse/entries
    Paginated raw activity entries for the authenticated user.
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    query = (
        db.table("pulse_entries")
        .select("*")
        .eq("user_id", str(user_id))
        .order("occurred_at", desc=True)
        .limit(limit)
        .offset(offset)
    )

    if platform:
        query = query.eq("platform", platform)
    if tag:
        query = query.contains("tags", [tag])

    result = query.execute()

    return [
        PulseEntry(
            id=e["id"],
            platform=e["platform"],
            entry_type=e["entry_type"],
            raw_metric=e["raw_metric"],
            proof_url=e.get("proof_url"),
            impact_score=e["impact_score"] or 0,
            tags=e["tags"] or [],
            occurred_at=e["occurred_at"],
        )
        for e in result.data or []
    ]


@router.post("/sync", response_model=SyncResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_sync(
    body: SyncRequest,
    background_tasks: BackgroundTasks,
    authorization: str = "",
):
    """
    POST /api/pulse/sync
    Triggers an on-demand ingestion run for a specific platform.
    Returns immediately with a run_id; progress streams via Supabase Realtime
    on the mission_logs table filtered by user_id.

    The frontend terminal widget subscribes to:
      supabase
        .channel('sync_logs')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'mission_logs',
          filter: `user_id=eq.${userId}`
        }, handler)
        .subscribe()
    """
    user_id = get_current_user_id(authorization)
    db = get_supabase_admin()

    valid_platforms = {"github", "leetcode", "supabase"}
    if body.platform not in valid_platforms:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid platform. Must be one of: {', '.join(valid_platforms)}",
        )

    # Verify user has connected this platform
    user_row = (
        db.table("users")
        .select("connected_platforms")
        .eq("id", str(user_id))
        .single()
        .execute()
    )
    connected = user_row.data.get("connected_platforms", {}) if user_row.data else {}
    if body.platform not in connected:
        raise HTTPException(
            status_code=400,
            detail=f"Platform '{body.platform}' is not connected. Connect it in Settings first.",
        )

    # Create an ingestion_runs record (tracked for idempotency + UI status)
    run_result = (
        db.table("ingestion_runs")
        .insert({
            "user_id": str(user_id),
            "platform": body.platform,
            "status": "running",
        })
        .select("id")
        .execute()
    )
    run_id = UUID(run_result.data[0]["id"])

    # Kick off the ingestion pipeline in the background.
    # The pipeline writes log rows to mission_logs as it progresses —
    # the frontend streams these via Supabase Realtime.
    background_tasks.add_task(_run_ingestion, str(user_id), body.platform, run_id)

    return SyncResponse(
        run_id=run_id,
        status="running",
        message=f"Ingestion started for {body.platform}. Streaming logs via Supabase Realtime.",
    )


# ── BACKGROUND TASK ──────────────────────────────────────────────

async def _run_ingestion(user_id: str, platform: str, run_id: UUID) -> None:
    """
    Runs inside FastAPI BackgroundTasks.
    Calls the agents/ingestion pipeline and writes progress to mission_logs
    so the frontend terminal can stream real updates.
    """
    from agents.ingestion.ingestion_pipeline import run_ingestion_for_user

    db = get_supabase_admin()

    def log(msg: str, level: str = "info") -> None:
        db.table("mission_logs").insert({
            "mission_id": None,  # NULL mission_id = user-level sync log
            "user_id": user_id,
            "log_level": level,
            "message": msg,
        }).execute()

    try:
        log(f"[{platform.upper()}] Initializing ingestion daemon...")
        entries_added = await run_ingestion_for_user(
            user_id=user_id,
            platform=platform,
            log_callback=log,
        )
        log(f"Ingestion complete. {entries_added} new entries indexed.", "success")
        db.table("ingestion_runs").update({
            "status": "completed",
            "entries_new": entries_added,
            "finished_at": "now()",
        }).eq("id", str(run_id)).execute()

    except Exception as exc:
        log(f"Ingestion failed: {exc}", "error")
        db.table("ingestion_runs").update({
            "status": "failed",
            "error_msg": str(exc),
            "finished_at": "now()",
        }).eq("id", str(run_id)).execute()
