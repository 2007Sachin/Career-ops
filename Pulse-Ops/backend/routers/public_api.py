import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Request, Depends, HTTPException, Header
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1", tags=["public_b2b_api"])

async def verify_b2b_api_key(x_api_key: str = Header(...)):
    # Mock validation: Check against recruiters table where api_key == x_api_key
    if not x_api_key.startswith("pulse_pk_"):
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

class VerifyRequest(BaseModel):
    github_username: str
    email: Optional[str] = None
    skills_to_verify: List[str]

class MatchRequest(BaseModel):
    github_username: str
    job_requirements: List[str]

@router.post("/verify")
@limiter.limit("100/hour")
async def verify_candidate(request: Request, body: VerifyRequest, api_key: str = Depends(verify_b2b_api_key)):
    verification_id = f"ver_{uuid.uuid4().hex[:16]}"
    
    # In a real scenario, query pulse_entries for this github_username 
    # matching the requested skills and calculate true confidence
    
    verified_skills = []
    for skill in body.skills_to_verify:
        verified_skills.append({
            "skill": skill,
            "confidence": 85,
            "evidence_count": 3,
            "latest_evidence_date": datetime.utcnow().isoformat()
        })
        
    response = {
        "pulse_score": 78,
        "verified_skills": verified_skills,
        "verification_timestamp": datetime.utcnow().isoformat(),
        "verification_id": verification_id
    }
    return response

@router.get("/verify/{verification_id}")
@limiter.limit("100/hour")
async def get_verification_report(request: Request, verification_id: str, api_key: str = Depends(verify_b2b_api_key)):
    return {
        "verification_id": verification_id,
        "github_username": "agent-cipher",
        "pulse_score": 78,
        "detailed_evidence": [
            {
                "skill": "Python",
                "entries": [
                    {
                        "raw_metric": "Merged PR #402 — Automated ETL Pipeline",
                        "proof_url": "https://github.com/agent-cipher/etl-pipeline/pull/402",
                        "impact_score": 8,
                        "occurred_at": "2026-04-12"
                    }
                ]
            }
        ]
    }

@router.post("/match")
@limiter.limit("100/hour")
async def match_candidate(request: Request, body: MatchRequest, api_key: str = Depends(verify_b2b_api_key)):
    req_scores = []
    for req in body.job_requirements:
        req_scores.append({
            "requirement": req,
            "score": 88,
            "evidence_summary": f"Strong evidence found in backend APIs matching {req}."
        })
    return {
        "match_score": 88,
        "per_requirement_scores": req_scores
    }

# Stub: Webhook Trigger
async def trigger_recruiter_webhook(recruiter_id: str, candidate_score: int, payload: dict):
    """
    Called by the ingestion pipeline.
    Query recruiter's configured webhook URL and threshold.
    if candidate_score >= threshold:
       requests.post(webhook_url, json=payload, headers={'X-Pulse-Signature': hmac_sig})
    """
    pass
