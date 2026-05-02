import os
from typing import List, Dict, Any, Tuple
from supabase import create_client, Client
from openai import AsyncOpenAI
from agents.models.schemas import JobSchema

supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

async def match_job_requirements(job: JobSchema, user_id: str) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Performs vector search for each hard requirement against user's pulse entries.
    Returns:
        - overall_match_score (0-100)
        - retrieved_evidence: List of matched pulse entries across all requirements
    """
    supabase: Client = create_client(supabase_url, supabase_key)
    
    if not job.hard_requirements:
        return 0, []
        
    all_evidence = []
    total_score = 0.0
    req_count = len(job.hard_requirements)
    
    seen_entry_ids = set()
    
    for req in job.hard_requirements:
        resp = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=req
        )
        req_embedding = resp.data[0].embedding
        
        rpc_resp = supabase.rpc("match_pulse_entries", {
            "query_embedding": req_embedding,
            "target_user_id": user_id,
            "match_count": 3
        }).execute()
        
        matches = rpc_resp.data or []
        
        req_score = 0
        if matches:
            top_sim = matches[0].get("similarity", 0)
            if top_sim > 0.8:
                req_score = 100
            elif top_sim > 0.7:
                req_score = 75
            elif top_sim > 0.6:
                req_score = 50
            else:
                req_score = 25
                
            for m in matches:
                if m["entry_id"] not in seen_entry_ids:
                    seen_entry_ids.add(m["entry_id"])
                    m["matched_requirement"] = req 
                    all_evidence.append(m)
        
        total_score += req_score
        
    overall_match_score = int(total_score / req_count) if req_count > 0 else 0
    
    return overall_match_score, all_evidence
