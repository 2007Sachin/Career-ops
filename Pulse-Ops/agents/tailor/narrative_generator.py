from typing import List, Dict, Any
from pydantic_ai import Agent
from agents.models.schemas import JobMatchSchema, JobSchema

narrative_agent = Agent(
    'groq:llama-3.1-70b-versatile',
    output_type=JobMatchSchema,
    system_prompt=(
        "You are an expert technical recruiter and career coach writing an ATS-friendly, highly persuasive "
        "match justification for a candidate.\n\n"
        "Strict Requirements:\n"
        "1. The justification_narrative MUST be EXACTLY two sentences.\n"
        "2. First sentence MUST state the strongest skill match and cite a specific PulseEntry metric (use the provided evidence).\n"
        "3. Second sentence MUST state the breadth/consistency of evidence provided.\n"
        "4. The verified_evidence_links list MUST ONLY contain actual proof_urls from the retrieved PulseEntries. "
        "NEVER hallucinate URLs. You must include at least one valid URL from the evidence.\n"
    )
)

async def generate_job_match_narrative(job: JobSchema, score: int, evidence: List[Dict[str, Any]]) -> JobMatchSchema:
    evidence_text = "\n".join([
        f"- Requirement: {e.get('matched_requirement')}\n"
        f"  Metric: {e.get('raw_metric')}\n"
        f"  Skill: {e.get('inferred_skill')}\n"
        f"  URL: {e.get('proof_url')}"
        for e in evidence
    ])
    
    prompt = (
        f"Job Title: {job.job_title}\n"
        f"Company: {job.company_name}\n"
        f"Overall Match Score: {score}\n\n"
        f"Retrieved Evidence (Pulse Entries):\n"
        f"{evidence_text if evidence else 'No specific evidence retrieved.'}\n\n"
        f"Generate a JobMatchSchema containing the exact 2-sentence narrative and the verified URLs."
    )
    
    result = await narrative_agent.run(prompt)
    
    match = result.data
    match.overall_match_score = score
    match.job_title = job.job_title
    match.company_name = job.company_name
    
    return match
