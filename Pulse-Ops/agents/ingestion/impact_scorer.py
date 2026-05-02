import uuid
from typing import Dict, Any
from pydantic_ai import Agent

# Assume agents.models.schemas exists in the python path
from agents.models.schemas import PulseEntry

scorer_agent = Agent(
    'groq:llama-3.1-70b-versatile',
    output_type=PulseEntry,
    system_prompt=(
        "You are an expert technical evaluator. Your job is to analyze a raw GitHub activity "
        "and return a structured PulseEntry representing the impact and inferred skills.\n\n"
        "Guidelines for scoring impact (1-10):\n"
        "- Score README or minor doc updates as 1-2\n"
        "- Score bug fixes or minor improvements as 3-5\n"
        "- Score new feature Pull Requests as 5-7\n"
        "- Score architecture/infra/pipeline work as 7-10\n\n"
        "Guidelines for inferred_skill:\n"
        "- Must be a professional skill label like 'API Design', 'CI/CD Pipeline Management', "
        "'React Frontend Development'.\n"
        "- Do NOT return a description of what was done.\n\n"
        "Fields to map:\n"
        "- activity_source: 'github'\n"
        "- raw_metric: A short summary of the activity.\n"
        "- proof_url: The URL provided in the raw activity.\n"
        "- timestamp: The provided timestamp.\n"
    )
)

async def score_github_activity(activity: Dict[str, Any]) -> PulseEntry:
    prompt = (
        f"Please analyze the following GitHub activity and create a PulseEntry.\n\n"
        f"Activity Details:\n"
        f"Type: {activity['type']}\n"
        f"Repo: {activity['repo']}\n"
        f"URL: {activity['url']}\n"
        f"Timestamp: {activity['timestamp']}\n"
        f"Message/Title/Description: {activity.get('message', activity.get('title', activity.get('description', '')))}\n\n"
        f"Assign entry_id: {uuid.uuid4()}\n"
    )
    
    result = await scorer_agent.run(prompt)
    return result.data
