from typing import Dict, Any

from shared.supabase_client import supabase
from agents.models.schemas import JobSchema
from agents.tailor.matcher import match_job_requirements
from agents.tailor.narrative_generator import generate_job_match_narrative
from agents.tailor.pdf_generator import generate_and_upload_pdf


async def run_tailor_pipeline(mission_id: str) -> Dict[str, Any]:
    # 1. Fetch Mission & Job — PK is "id", not "mission_id"
    mission_res = (
        supabase.table("missions")
        .select("*, jobs(*)")
        .eq("id", mission_id)
        .single()
        .execute()
    )
    if not mission_res.data:
        raise Exception("Mission not found")

    mission = mission_res.data
    user_id = mission["user_id"]
    job_data = mission.get("jobs")

    if not job_data:
        raise Exception("Job not found for this mission")

    job = JobSchema(
        job_title=job_data.get("job_title", ""),
        company_name=job_data.get("company_name", ""),
        source_url=job_data.get("source_url"),
        hard_requirements=job_data.get("hard_requirements") or [],
        soft_requirements=[],
        salary_range=job_data.get("salary_range"),
        location=job_data.get("location"),
        domain=job_data.get("domain"),
    )

    # 2. Match
    score, evidence = await match_job_requirements(job, user_id)

    # 3. Generate Narrative
    match_schema = await generate_job_match_narrative(job, score, evidence)

    # 4. Generate PDF
    user_res = supabase.table("users").select("*").eq("id", user_id).single().execute()
    user_info = user_res.data or {}

    pdf_url = generate_and_upload_pdf(user_info, match_schema, evidence)

    # 5. Update Mission Status — PK is "id"
    update_data = {
        "status": "awaiting_approval",
        "match_score": score,
        "justification_narrative": match_schema.justification_narrative,
        "verified_evidence_links": [str(url) for url in match_schema.verified_evidence_links],
        "tailored_pdf_url": pdf_url,
    }
    supabase.table("missions").update(update_data).eq("id", mission_id).execute()

    return {
        "status": "success",
        "mission_id": mission_id,
        "match_score": score,
        "pdf_url": pdf_url,
    }
