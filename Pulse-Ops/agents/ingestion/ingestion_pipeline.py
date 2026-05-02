from typing import List, Dict, Any

from shared.supabase_client import supabase
from agents.ingestion.github_fetcher import fetch_recent_github_activity
from agents.ingestion.leetcode_fetcher import fetch_recent_leetcode_activity
from agents.ingestion.supabase_log_fetcher import fetch_recent_supabase_changes
from agents.ingestion.impact_scorer import score_github_activity
from agents.models.schemas import PulseEntry
from agents.ingestion.pulse_score import calculate_and_update_pulse_score


async def _process_and_upsert_entries(entries: List[PulseEntry], user_id: str) -> int:
    processed_count = 0
    for pulse_entry in entries:
        # Deduplication: skip entries whose proof_url is already indexed
        existing = (
            supabase.table("pulse_entries")
            .select("id")
            .eq("proof_url", str(pulse_entry.proof_url))
            .execute()
        )
        if existing.data:
            continue

        db_record = {
            "user_id": user_id,
            "platform": pulse_entry.platform,
            "occurred_at": pulse_entry.occurred_at.isoformat(),
            "raw_metric": pulse_entry.raw_metric,
            "proof_url": str(pulse_entry.proof_url),
            "tags": pulse_entry.tags,
            "impact_score": pulse_entry.impact_score,
        }

        supabase.table("pulse_entries").insert(db_record).execute()
        processed_count += 1
    return processed_count


async def run_github_ingestion_pipeline(
    user_id: str,
    github_username: str,
    github_token: str | None = None,
    log_callback=None,
) -> Dict[str, Any]:
    if log_callback:
        log_callback(f"[GITHUB] Fetching activity for @{github_username}...")
    raw_activities = await fetch_recent_github_activity(github_username, github_token)
    if not raw_activities:
        await calculate_and_update_pulse_score(user_id)
        return {"status": "success", "message": "No new activities found", "processed": 0}

    entries = []
    for activity in raw_activities:
        pulse_entry = await score_github_activity(activity)
        entries.append(pulse_entry)

    processed = await _process_and_upsert_entries(entries, user_id)
    await calculate_and_update_pulse_score(user_id)
    if log_callback:
        log_callback(f"[GITHUB] {processed} new entries indexed.", "success")
    return {"status": "success", "processed": processed}


async def run_leetcode_ingestion_pipeline(
    user_id: str,
    leetcode_username: str,
    log_callback=None,
) -> Dict[str, Any]:
    if log_callback:
        log_callback(f"[LEETCODE] Fetching activity for {leetcode_username}...")
    entries = await fetch_recent_leetcode_activity(leetcode_username)
    if not entries:
        await calculate_and_update_pulse_score(user_id)
        return {"status": "success", "message": "No new activities found", "processed": 0}
    processed = await _process_and_upsert_entries(entries, user_id)
    await calculate_and_update_pulse_score(user_id)
    if log_callback:
        log_callback(f"[LEETCODE] {processed} new entries indexed.", "success")
    return {"status": "success", "processed": processed}


async def run_supabase_ingestion_pipeline(
    user_id: str,
    project_ref: str,
    access_token: str,
    log_callback=None,
) -> Dict[str, Any]:
    if log_callback:
        log_callback(f"[SUPABASE] Fetching schema changes for project {project_ref}...")
    entries = await fetch_recent_supabase_changes(project_ref, access_token)
    if not entries:
        await calculate_and_update_pulse_score(user_id)
        return {"status": "success", "message": "No new activities found", "processed": 0}
    processed = await _process_and_upsert_entries(entries, user_id)
    await calculate_and_update_pulse_score(user_id)
    if log_callback:
        log_callback(f"[SUPABASE] {processed} new entries indexed.", "success")
    return {"status": "success", "processed": processed}


async def run_all_ingestion_pipelines(
    user_id: str,
    github_username: str | None = None,
    github_token: str | None = None,
    leetcode_username: str | None = None,
    supabase_project_ref: str | None = None,
    supabase_access_token: str | None = None,
    log_callback=None,
) -> Dict[str, Any]:
    total_processed = 0
    results = {}

    if github_username:
        gh_res = await run_github_ingestion_pipeline(user_id, github_username, github_token, log_callback)
        total_processed += gh_res.get("processed", 0)
        results["github"] = gh_res

    if leetcode_username:
        lc_res = await run_leetcode_ingestion_pipeline(user_id, leetcode_username, log_callback)
        total_processed += lc_res.get("processed", 0)
        results["leetcode"] = lc_res

    if supabase_project_ref and supabase_access_token:
        sb_res = await run_supabase_ingestion_pipeline(
            user_id, supabase_project_ref, supabase_access_token, log_callback
        )
        total_processed += sb_res.get("processed", 0)
        results["supabase"] = sb_res

    score_res = await calculate_and_update_pulse_score(user_id)
    results["pulse_score_update"] = score_res

    return {
        "status": "success",
        "total_processed": total_processed,
        "details": results,
    }


async def run_ingestion_for_user(
    user_id: str,
    platform: str,
    log_callback=None,
) -> int:
    """
    Called by pulse.py's /api/pulse/sync endpoint.
    Reads connected_platforms from the DB to get credentials, then runs
    the appropriate pipeline. Returns the number of new entries indexed.
    """
    user_row = (
        supabase.table("users")
        .select("connected_platforms")
        .eq("id", user_id)
        .single()
        .execute()
    )
    connected: dict = (user_row.data or {}).get("connected_platforms", {})
    creds = connected.get(platform, {})

    if platform == "github":
        username = creds.get("username") if isinstance(creds, dict) else None
        if not username:
            raise ValueError("GitHub username not found in connected_platforms")
        token = creds.get("token") if isinstance(creds, dict) else None
        result = await run_github_ingestion_pipeline(user_id, username, token, log_callback)
    elif platform == "leetcode":
        username = creds.get("username") if isinstance(creds, dict) else None
        if not username:
            raise ValueError("LeetCode username not found in connected_platforms")
        result = await run_leetcode_ingestion_pipeline(user_id, username, log_callback)
    elif platform == "supabase":
        project_ref = creds.get("project_ref") if isinstance(creds, dict) else None
        access_token = creds.get("access_token") if isinstance(creds, dict) else None
        if not project_ref or not access_token:
            raise ValueError("Supabase project_ref/access_token not found in connected_platforms")
        result = await run_supabase_ingestion_pipeline(user_id, project_ref, access_token, log_callback)
    else:
        raise ValueError(f"Unknown platform: {platform}")

    return result.get("processed", 0)
