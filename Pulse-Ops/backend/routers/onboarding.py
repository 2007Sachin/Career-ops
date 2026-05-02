"""
Onboarding API router — profile upsert, LeetCode/Supabase validation,
and onboarding-complete flag.
"""

import httpx
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

from shared.supabase_client import supabase as _sb

router = APIRouter(tags=["onboarding"])


# ── Request / response schemas ───────────────────────────────────

class InternshipPayload(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    project_description: Optional[str] = None
    skills: List[str] = []


class ProfilePayload(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    current_role: Optional[str] = None
    target_domains: List[str] = []
    target_roles: Optional[str] = None       # comma-separated string
    min_salary_lpa: Optional[int] = None
    location_preference: Optional[str] = None
    internships: List[InternshipPayload] = []


class SupabaseValidateBody(BaseModel):
    project_url: str
    service_key: str


# ── 1. POST /api/users/{user_id}/profile ─────────────────────────
@router.post("/api/users/{user_id}/profile")
async def upsert_user_profile(user_id: str, body: ProfilePayload):
    """
    Upserts the user's profile. All career preference fields (target_domains,
    target_roles, min_salary_lpa, internships) are stored directly on the
    users table — NOT in separate mission_parameters / user_internships tables.
    """
    user_data: dict = {
        "id": user_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if body.full_name is not None:
        user_data["full_name"] = body.full_name
    if body.email is not None:
        user_data["email"] = body.email
    if body.current_role is not None:
        user_data["current_role"] = body.current_role
    if body.location_preference is not None:
        user_data["location_preference"] = body.location_preference
    if body.target_domains:
        user_data["target_domains"] = body.target_domains
    if body.target_roles:
        user_data["target_roles"] = [r.strip() for r in body.target_roles.split(",") if r.strip()]
    if body.min_salary_lpa is not None:
        user_data["min_salary_lpa"] = body.min_salary_lpa
    if body.internships:
        # Stored as JSONB on the users table
        user_data["internships"] = [i.model_dump() for i in body.internships]

    res = _sb.table("users").upsert(user_data, on_conflict="id").execute()
    user = res.data[0] if res.data else user_data

    return {
        "user": user,
        "internships": user_data.get("internships", []),
        "status": "ok",
    }


# ── 2. POST /api/users/{user_id}/onboarding-complete ─────────────
@router.post("/api/users/{user_id}/onboarding-complete")
async def mark_onboarding_complete(user_id: str):
    res = (
        _sb.table("users")
        .update({
            "onboarded": True,                                   # column name in schema
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok", "onboarded": True}


# ── 3. GET /api/users/{user_id}/onboarding-status ────────────────
@router.get("/api/users/{user_id}/onboarding-status")
async def get_onboarding_status(user_id: str):
    res = _sb.table("users").select("onboarded").eq("id", user_id).execute()
    if not res.data:
        return {"onboarded": False}
    return {"onboarded": res.data[0].get("onboarded", False)}


# ── 4. GET /api/validate/leetcode/{username} ──────────────────────
@router.get("/api/validate/leetcode/{username}")
async def validate_leetcode(username: str):
    url = "https://leetcode.com/graphql"
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
        }
    }
    """

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                json={"query": query, "variables": {"username": username}},
                headers={"Content-Type": "application/json"},
            )

        if resp.status_code != 200:
            return {"valid": False, "problems_solved": None, "username": username}

        data = resp.json()
        matched = data.get("data", {}).get("matchedUser")

        if matched is None:
            return {"valid": False, "problems_solved": None, "username": username}

        submissions = matched.get("submitStats", {}).get("acSubmissionNum", [])
        total = 0
        hard = 0
        for s in submissions:
            if s.get("difficulty") == "All":
                total = s.get("count", 0)
            elif s.get("difficulty") == "Hard":
                hard = s.get("count", 0)

        return {
            "valid": True,
            "problems_solved": total,
            "hard_solved": hard,
            "username": matched.get("username", username),
        }

    except Exception:
        return {"valid": False, "problems_solved": None, "username": username}


# ── 5. POST /api/validate/supabase ────────────────────────────────
@router.post("/api/validate/supabase")
async def validate_supabase(body: SupabaseValidateBody):
    try:
        client = create_client(body.project_url, body.service_key)
        # Probe connectivity — list users table (safe, returns 0 rows in worst case)
        client.table("users").select("id", count="exact").limit(0).execute()
        return {
            "valid": True,
            "project_name": (
                body.project_url.split("//")[1].split(".")[0]
                if "//" in body.project_url
                else None
            ),
        }
    except Exception as e:
        return {"valid": False, "project_name": None, "error": str(e)}
