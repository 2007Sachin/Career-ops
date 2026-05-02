import httpx
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

GITHUB_API_URL = "https://api.github.com"

async def fetch_recent_github_activity(username: str, token: str = None) -> List[Dict[str, Any]]:
    """
    Fetches the user's recent GitHub activity (commits, PRs, issues, repos) from the last 24 hours.
    Handles rate limiting by raising an exception if 403 occurs.
    """
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
        
    activities = []
    time_threshold = datetime.now(timezone.utc) - timedelta(hours=24)
    
    url = f"{GITHUB_API_URL}/users/{username}/events"
    
    async with httpx.AsyncClient() as client:
        page = 1
        while True:
            response = await client.get(url, headers=headers, params={"per_page": 100, "page": page})
            
            if response.status_code == 403:
                reset_time = response.headers.get("X-RateLimit-Reset")
                raise Exception(f"Rate limited by GitHub. Reset time: {reset_time}")
                
            response.raise_for_status()
            events = response.json()
            
            if not events:
                break
                
            older_than_threshold = False
            
            for event in events:
                created_at = datetime.fromisoformat(event["created_at"].replace("Z", "+00:00"))
                if created_at < time_threshold:
                    older_than_threshold = True
                    break
                    
                event_type = event["type"]
                repo_name = event["repo"]["name"]
                
                # Extract commits
                if event_type == "PushEvent":
                    for commit in event["payload"].get("commits", []):
                        activities.append({
                            "type": "commit",
                            "repo": repo_name,
                            "timestamp": created_at.isoformat(),
                            "message": commit["message"],
                            "url": f"https://github.com/{repo_name}/commit/{commit['sha']}"
                        })
                # Extract PRs
                elif event_type == "PullRequestEvent" and event["payload"]["action"] == "closed" and event["payload"]["pull_request"]["merged"]:
                    pr = event["payload"]["pull_request"]
                    activities.append({
                        "type": "pr_merged",
                        "repo": repo_name,
                        "timestamp": created_at.isoformat(),
                        "title": pr["title"],
                        "url": pr["html_url"]
                    })
                # Extract Issues
                elif event_type == "IssuesEvent" and event["payload"]["action"] == "closed":
                    issue = event["payload"]["issue"]
                    activities.append({
                        "type": "issue_closed",
                        "repo": repo_name,
                        "timestamp": created_at.isoformat(),
                        "title": issue["title"],
                        "url": issue["html_url"]
                    })
                # Extract Repos Created
                elif event_type == "CreateEvent" and event["payload"]["ref_type"] == "repository":
                    activities.append({
                        "type": "repo_created",
                        "repo": repo_name,
                        "timestamp": created_at.isoformat(),
                        "description": event["payload"].get("description", ""),
                        "url": f"https://github.com/{repo_name}"
                    })
                    
            if older_than_threshold:
                break
                
            page += 1
            
    return activities
