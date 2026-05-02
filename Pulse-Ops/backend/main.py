import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict

from shared.constants import APP_NAME

from agents.ingestion.ingestion_pipeline import (
    run_github_ingestion_pipeline,
    run_all_ingestion_pipelines,
)
from agents.ingestion.pulse_score import calculate_and_update_pulse_score
from agents.tailor.tailor_pipeline import run_tailor_pipeline
from agents.outreach.outreach_pipeline import run_outreach_pipeline
from agents.outreach.executor import resume_hitl_and_submit
from backend.scheduler import setup_scheduler, get_queue_status

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from backend.routers.public_api import router as public_api_router, limiter
from backend.routers.onboarding import router as onboarding_router
from backend.routers.missions import router as missions_router
from backend.routers.candidates import router as candidates_router
from backend.routers.pulse import router as pulse_router

# ── CORS ────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(title=APP_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_api_router)
app.include_router(onboarding_router)
app.include_router(missions_router)
app.include_router(candidates_router)
app.include_router(pulse_router)


@app.on_event("startup")
async def startup_event():
    setup_scheduler()


# ── Admin auth ──────────────────────────────────────────────────────
def verify_admin_key(x_admin_key: str = Header(...)):
    expected_key = os.getenv("ADMIN_API_KEY")
    if not expected_key:
        raise HTTPException(status_code=503, detail="ADMIN_API_KEY not configured")
    if x_admin_key != expected_key:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/api/admin/queue-status")
async def queue_status(admin=Depends(verify_admin_key)):
    return get_queue_status()


# ── WebSocket (legacy real-time; Supabase Realtime is preferred) ────
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        for conn in self.active_connections.get(user_id, []):
            await conn.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# ── Health ──────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": f"Welcome to {APP_NAME} API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ── Legacy ingestion endpoints (kept for backward compat) ───────────
# Prefer POST /api/pulse/sync for new clients — it reads credentials from DB.

class IngestionRequest(BaseModel):
    github_username: str
    github_token: Optional[str] = None


class AllIngestionRequest(BaseModel):
    github_username: Optional[str] = None
    github_token: Optional[str] = None
    leetcode_username: Optional[str] = None
    supabase_project_ref: Optional[str] = None
    supabase_access_token: Optional[str] = None


class HITLResponseRequest(BaseModel):
    session_id: str
    responses: Dict[str, str]


@app.post("/api/ingest/{user_id}")
async def trigger_ingestion(user_id: str, request: IngestionRequest):
    try:
        return await run_github_ingestion_pipeline(
            user_id=user_id,
            github_username=request.github_username,
            github_token=request.github_token,
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/ingest/{user_id}/all")
async def trigger_all_ingestion(user_id: str, request: AllIngestionRequest):
    try:
        return await run_all_ingestion_pipelines(
            user_id=user_id,
            github_username=request.github_username,
            github_token=request.github_token,
            leetcode_username=request.leetcode_username,
            supabase_project_ref=request.supabase_project_ref,
            supabase_access_token=request.supabase_access_token,
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/users/{user_id}/pulse-score")
async def get_pulse_score(user_id: str):
    try:
        return await calculate_and_update_pulse_score(user_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/tailor/{mission_id}")
async def trigger_tailor_pipeline(mission_id: str):
    try:
        return await run_tailor_pipeline(mission_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/outreach/{mission_id}")
async def trigger_outreach_pipeline(mission_id: str):
    try:
        return await run_outreach_pipeline(mission_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/missions/{mission_id}/hitl-response")
async def submit_hitl_response(mission_id: str, request: HITLResponseRequest):
    try:
        return await resume_hitl_and_submit(mission_id, request.responses, request.session_id)
    except Exception as e:
        return {"status": "error", "message": str(e)}
