import httpx
from datetime import datetime, timedelta, timezone
from typing import List
import uuid

from agents.models.schemas import PulseEntry

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

async def fetch_recent_leetcode_activity(username: str) -> List[PulseEntry]:
    """
    Fetches the user's recent LeetCode accepted submissions from the last 7 days.
    """
    query = """
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
    """
    
    variables = {
        "username": username,
        "limit": 50
    }
    
    pulse_entries = []
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": query, "variables": variables}
        )
        response.raise_for_status()
        data = response.json().get("data", {})
        submissions = data.get("recentAcSubmissionList", [])
        
        for sub in submissions:
            sub_timestamp = datetime.fromtimestamp(int(sub["timestamp"]), tz=timezone.utc)
            if sub_timestamp < seven_days_ago:
                continue
                
            # Fetch difficulty for each submission
            title_slug = sub["titleSlug"]
            diff_query = """
            query questionTitle($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                difficulty
              }
            }
            """
            diff_resp = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": diff_query, "variables": {"titleSlug": title_slug}}
            )
            diff_data = diff_resp.json().get("data", {}).get("question", {})
            difficulty = diff_data.get("difficulty", "Easy")
            
            # Map logic
            if difficulty == "Easy":
                skill = "DSA Fundamentals"
                weight = 2
            elif difficulty == "Medium":
                skill = "Algorithm Design"
                weight = 5
            else:
                skill = "Advanced Problem Solving"
                weight = 8
                
            pulse_entries.append(
                PulseEntry(
                    entry_id=uuid.uuid4(),
                    activity_source="leetcode",
                    timestamp=sub_timestamp,
                    raw_metric=f"Solved {sub['title']} ({difficulty}) in {sub['lang']}",
                    proof_url=f"https://leetcode.com/problems/{title_slug}/",
                    inferred_skill=skill,
                    impact_weight=weight
                )
            )
            
    return pulse_entries
