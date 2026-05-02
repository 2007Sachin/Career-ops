import math
from datetime import datetime, timezone
from typing import Dict, Any

from shared.supabase_client import supabase


def calculate_time_decay(days_ago: float) -> float:
    if days_ago <= 0:
        return 1.0
    if days_ago >= 90:
        return 0.1
    # Exponential decay: 30 days → 0.5 weight
    lam = 0.0231049
    return max(0.1, math.exp(-lam * days_ago))


async def calculate_and_update_pulse_score(user_id: str) -> Dict[str, Any]:
    response = supabase.table("pulse_entries").select("*").eq("user_id", user_id).execute()
    entries = response.data or []

    now = datetime.now(timezone.utc)
    zero_result = {
        "score": 0,
        "breakdown": {
            "recency_component": 0,
            "diversity_component": 0,
            "consistency_component": 0,
        },
    }

    if not entries:
        supabase.table("pulse_scores").upsert(
            {
                "user_id": user_id,
                "total": 0,
                "recency": 0,
                "diversity": 0,
                "consistency": 0,
                "sparkline": [],
                "skill_scores": {},
                "computed_at": now.isoformat(),
            },
            on_conflict="user_id",
        ).execute()
        return zero_result

    recency_sum = 0.0
    distinct_skills: set[str] = set()
    active_days_last_30: set = set()

    for entry in entries:
        ts_str = entry.get("occurred_at", "")
        if not ts_str:
            continue
        if ts_str.endswith("Z"):
            ts_str = ts_str.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(ts_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

        days_ago = (now - dt).total_seconds() / 86400.0

        weight = calculate_time_decay(days_ago)
        impact = float(entry.get("impact_score", 0))
        recency_sum += impact * weight

        for tag in entry.get("tags") or []:
            distinct_skills.add(tag)

        if 0 <= days_ago <= 30:
            active_days_last_30.add(dt.date())

    num_skills = len(distinct_skills)
    diversity_bonus = 20 if num_skills >= 5 else (10 if num_skills >= 3 else 0)
    consistency_bonus = 10 if len(active_days_last_30) >= 20 else 0

    # Asymptotic curve caps recency at ~70; bonuses bring total to 100
    normalized_recency = 70.0 * (1.0 - math.exp(-0.02 * recency_sum))
    total_score = normalized_recency + diversity_bonus + consistency_bonus
    final_score = int(min(100.0, max(0.0, round(total_score))))

    supabase.table("pulse_scores").upsert(
        {
            "user_id": user_id,
            "total": final_score,
            "recency": int(round(normalized_recency)),
            "diversity": diversity_bonus,
            "consistency": consistency_bonus,
            "sparkline": [],
            "skill_scores": {s: 50 for s in list(distinct_skills)[:10]},
            "computed_at": now.isoformat(),
        },
        on_conflict="user_id",
    ).execute()

    return {
        "score": final_score,
        "breakdown": {
            "recency_component": round(normalized_recency, 2),
            "raw_recency_sum": round(recency_sum, 2),
            "diversity_component": diversity_bonus,
            "consistency_component": consistency_bonus,
            "raw_total": round(total_score, 2),
        },
    }
