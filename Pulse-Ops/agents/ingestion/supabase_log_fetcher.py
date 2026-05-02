import httpx
from datetime import datetime, timedelta, timezone
from typing import List
import uuid

from agents.models.schemas import PulseEntry

async def fetch_recent_supabase_changes(project_ref: str, access_token: str) -> List[PulseEntry]:
    """
    Fetches the user's recent Supabase DDL schema changes from the Management API (last 7 days).
    Maps them to PulseEntries with impact scores based on DDL complexity.
    """
    pulse_entries = []
    
    # Query Supabase Postgres logs using Analytics endpoint
    url = f"https://api.supabase.com/v1/projects/{project_ref}/analytics/endpoints/logs.all"
    
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    query = """
    select timestamp, event_message 
    from postgres_logs 
    where 
      event_message ilike '%CREATE TABLE%' or 
      event_message ilike '%ALTER TABLE%' or 
      event_message ilike '%CREATE POLICY%' or 
      event_message ilike '%CREATE FUNCTION%' 
    order by timestamp desc limit 100
    """
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json={"sql": query, "period_start": seven_days_ago}
            )
            response.raise_for_status()
            logs = response.json().get("result", [])
            
            for log in logs:
                msg = log.get("event_message", "").upper()
                timestamp_str = log.get("timestamp")
                if not timestamp_str or not msg:
                    continue
                
                # API format might be 2024-05-12T12:00:00Z -> standardizing to isoformat
                dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                
                # Scoring DDL complexity
                weight = 1
                skill = "Database Management"
                
                if "CREATE FUNCTION" in msg and "TRIGGER" in msg:
                    weight = 8
                    skill = "Advanced Database Operations & Triggers"
                elif "CREATE FUNCTION" in msg:
                    weight = 6
                    skill = "Database Functions"
                elif "CREATE TABLE" in msg and "ROW LEVEL SECURITY" in msg:
                    weight = 5
                    skill = "Secure Database Design"
                elif "CREATE POLICY" in msg:
                    weight = 5
                    skill = "Row Level Security (RLS)"
                elif "CREATE TABLE" in msg:
                    weight = 3
                    skill = "Schema Design"
                elif "ALTER TABLE" in msg and "ADD COLUMN" in msg:
                    weight = 2
                    skill = "Schema Evolution"
                elif "ALTER TABLE" in msg:
                    weight = 2
                    skill = "Schema Modification"
                    
                pulse_entries.append(
                    PulseEntry(
                        entry_id=uuid.uuid4(),
                        activity_source="supabase",
                        timestamp=dt,
                        raw_metric=f"Executed DDL: {msg[:100]}...",
                        proof_url=f"https://supabase.com/dashboard/project/{project_ref}",
                        inferred_skill=skill,
                        impact_weight=weight
                    )
                )
    except Exception as e:
        print(f"Failed to fetch Supabase logs: {e}")
        
    return pulse_entries
