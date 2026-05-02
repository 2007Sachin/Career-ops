# Pulse-Ops Python SDK

The official Python client for the Pulse-Ops B2B Verification API. Integrate programmatic engineering talent verification and scoring directly into your ATS or custom tooling.

## Installation

```bash
pip install pulse-sdk
```

## Quick Start

Initialize the client using your Recruiter API key (obtained from the Partner Portal).

```python
from pulse_sdk import PulseClient

client = PulseClient(api_key="pulse_pk_your_api_key_here")

# 1. Verify a Candidate
# Request verification of specific hard skills based on a candidate's GitHub handle.
response = client.verify_candidate(
    github_username="agent-cipher",
    skills_to_verify=["FastAPI", "PostgreSQL", "Kafka"]
)

print(f"Global Pulse Score: {response['pulse_score']}")
print(f"Verification ID: {response['verification_id']}")

# 2. Retrieve Detailed Audit
# Fetch the precise technical evidence (PRs, issues) backing the verification.
audit = client.get_verification_report(verification_id=response['verification_id'])
print(audit['detailed_evidence'])

# 3. Match Candidate Against Job
# Pass in a raw list of job requirements to get a granular, requirement-by-requirement match score.
match_result = client.match_candidate(
    github_username="agent-cipher",
    job_requirements=[
        "5+ years of experience building Python microservices",
        "Experience scaling relational databases"
    ]
)
print(f"Role Match Score: {match_result['match_score']}%")
```

## Webhooks

Pulse-Ops supports asynchronous webhook alerts. When configuring your recruiter profile via the dashboard, you can register a Webhook URL. 

When a new candidate enters our network and matches your specific job schema with a score `> 80%`, we will immediately POST the verification payload to your endpoint.

## Rate Limiting

The API is strictly rate-limited to **100 requests per hour** per API key.
If you exceed this, the SDK will raise an Exception.
