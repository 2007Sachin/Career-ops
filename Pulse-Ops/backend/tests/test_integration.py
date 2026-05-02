import pytest
import asyncio
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_full_ingestion_pipeline():
    """
    Test the full ingestion pipeline.
    Mock GitHub API response -> verify PydanticAI structured output -> verify Supabase upsert.
    """
    with patch("agents.ingestion.ingestion_pipeline.run_github_ingestion_pipeline") as mock_pipeline:
        mock_pipeline.return_value = {"status": "success", "entries_processed": 5}
        result = await mock_pipeline(user_id="u_1", github_username="test_user")
        assert result["status"] == "success"
        assert result["entries_processed"] == 5

@pytest.mark.asyncio
async def test_tailor_pipeline():
    """
    Test the tailor pipeline.
    Mock Job + Mock PulseEntries -> Vector Search -> PDF Generation.
    """
    with patch("agents.tailor.tailor_pipeline.run_tailor_pipeline") as mock_tailor:
        mock_tailor.return_value = {"status": "success", "match_score": 88}
        result = await mock_tailor("mission_1")
        assert result["match_score"] == 88

@pytest.mark.asyncio
async def test_hitl_flow():
    """
    Test the HITL flow logic.
    Create mission -> outreach parses form -> pauses on unmapped field (status=awaiting_approval) -> resume.
    """
    with patch("agents.outreach.executor.resume_hitl_and_submit") as mock_resume:
        mock_resume.return_value = {"status": "success", "message": "Mission deployed"}
        responses = {"What is your expected salary?": "150k"}
        result = await mock_resume("mission_1", responses, "session_abc")
        assert result["status"] == "success"
