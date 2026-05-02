import requests
from typing import List, Dict, Optional

class PulseClient:
    """
    Official Python SDK for the Pulse-Ops B2B API.
    Used by recruiters and ATS systems to programmatically verify engineering talent.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.pulse-ops.com/api/v1"):
        if not api_key.startswith("pulse_pk_"):
            raise ValueError("Invalid API key format. Must start with 'pulse_pk_'")
        
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "pulse-ops-python-sdk/1.0.0"
        })

    def _handle_response(self, response: requests.Response) -> Dict:
        if response.status_code == 429:
            raise Exception("Rate limit exceeded. Maximum 100 requests per hour.")
        response.raise_for_status()
        return response.json()

    def verify_candidate(self, github_username: str, skills_to_verify: List[str], email: Optional[str] = None) -> Dict:
        """
        Submits a candidate for asynchronous verification of specific skills.
        """
        payload = {
            "github_username": github_username,
            "skills_to_verify": skills_to_verify
        }
        if email:
            payload["email"] = email
            
        res = self.session.post(f"{self.base_url}/verify", json=payload)
        return self._handle_response(res)

    def get_verification_report(self, verification_id: str) -> Dict:
        """
        Retrieves a detailed verification report including actual evidence URLs.
        """
        res = self.session.get(f"{self.base_url}/verify/{verification_id}")
        return self._handle_response(res)

    def match_candidate(self, github_username: str, job_requirements: List[str]) -> Dict:
        """
        Scores a candidate against a specific set of job requirements.
        """
        payload = {
            "github_username": github_username,
            "job_requirements": job_requirements
        }
        res = self.session.post(f"{self.base_url}/match", json=payload)
        return self._handle_response(res)
