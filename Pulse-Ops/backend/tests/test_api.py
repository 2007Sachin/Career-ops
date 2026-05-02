import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_admin_queue_unauthorized():
    # Missing API Key
    response = client.get("/api/admin/queue-status")
    assert response.status_code == 422 # missing header
    
    # Invalid API Key
    response = client.get("/api/admin/queue-status", headers={"x-admin-key": "invalid_key"})
    assert response.status_code == 401

def test_b2b_verify_unauthorized():
    response = client.post("/api/v1/verify", json={
        "github_username": "test",
        "skills_to_verify": ["Python"]
    })
    # Missing header
    assert response.status_code == 422

def test_b2b_verify_invalid_key():
    response = client.post("/api/v1/verify", headers={"x-api-key": "wrong"}, json={
        "github_username": "test",
        "skills_to_verify": ["Python"]
    })
    # Expected format is pulse_pk_...
    assert response.status_code == 401

def test_b2b_verify_valid():
    response = client.post("/api/v1/verify", headers={"x-api-key": "pulse_pk_test"}, json={
        "github_username": "test",
        "skills_to_verify": ["Python"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "pulse_score" in data
    assert "verification_id" in data

def test_b2b_match():
    response = client.post("/api/v1/match", headers={"x-api-key": "pulse_pk_test"}, json={
        "github_username": "test",
        "job_requirements": ["Python", "Docker"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "match_score" in data

@pytest.mark.asyncio
async def test_websocket_connection():
    with client.websocket_connect("/ws/test_user") as websocket:
        # Just verifying connection works. Real test would check if it receives events.
        pass
