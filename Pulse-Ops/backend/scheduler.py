import time
from datetime import datetime, timedelta
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.logger import logger, log_agent_event
from shared.supabase_client import supabase

scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

task_stats = {
    "completed_today": 0,
    "failed_today": 0,
    "last_reset": datetime.now().date()
}

def check_stats_reset():
    today = datetime.now().date()
    if task_stats["last_reset"] != today:
        task_stats["completed_today"] = 0
        task_stats["failed_today"] = 0
        task_stats["last_reset"] = today

def get_queue_status():
    check_stats_reset()
    pending = len(scheduler.get_jobs())
    return {
        "pending_scheduled_tasks": pending,
        "completed_today": task_stats["completed_today"],
        "failed_today": task_stats["failed_today"],
        "status": "active"
    }

def handle_rate_limit(headers, agent_name, url):
    """
    Parses rate limit headers (like Retry-After or X-RateLimit-Reset).
    Logs the error and returns the sleep duration in seconds.
    """
    retry_after = headers.get("Retry-After")
    if retry_after:
        wait_seconds = int(retry_after)
    else:
        reset_time = headers.get("X-RateLimit-Reset")
        if reset_time:
            wait_seconds = max(0, int(reset_time) - int(time.time()))
        else:
            wait_seconds = 60 # Default wait 60s
    
    logger.warning("Rate limit hit.", agent_name=agent_name, endpoint=url, waiting_seconds=wait_seconds)
    return wait_seconds

async def job_daily_ingestion():
    check_stats_reset()
    start_time = time.time()
    logger.info("Starting daily ingestion cron.")
    try:
        res = supabase.table("users").select("id").execute()
        users = res.data or []
        
        for u in users:
            try:
                # In a full implementation, we'd call run_all_ingestion_pipelines
                # If a 429 is raised, we extract the wait time and asyncio.sleep(wait_seconds)
                pass
            except Exception as e:
                task_stats["failed_today"] += 1
                logger.error("Daily ingestion failed for user", user_id=u["id"], error=str(e))
                continue
                
        task_stats["completed_today"] += 1
        duration = int((time.time() - start_time) * 1000)
        log_agent_event("SYSTEM", "DailyIngestionCron", "run", duration, "success")
    except Exception as e:
        task_stats["failed_today"] += 1
        logger.error("Daily ingestion cron failed.", error=str(e))

async def job_scout_feed():
    check_stats_reset()
    start_time = time.time()
    try:
        task_stats["completed_today"] += 1
        duration = int((time.time() - start_time) * 1000)
        log_agent_event("SYSTEM", "ScoutCron", "run", duration, "success")
    except Exception as e:
        task_stats["failed_today"] += 1
        logger.error("Scout cron failed.", error=str(e))

async def job_expire_jobs():
    check_stats_reset()
    start_time = time.time()
    try:
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        # "expired" is not in job_status_enum; use "closed" for stale jobs
        supabase.table("jobs").update({"status": "closed"}).lt("created_at", thirty_days_ago).execute()
        task_stats["completed_today"] += 1
        duration = int((time.time() - start_time) * 1000)
        log_agent_event("SYSTEM", "JobExpiryCron", "run", duration, "success")
    except Exception as e:
        task_stats["failed_today"] += 1
        logger.error("Job expiry failed.", error=str(e))

def setup_scheduler():
    # 1. Daily Ingestion at 12:00 AM IST
    scheduler.add_job(job_daily_ingestion, 'cron', hour=0, minute=0, id='daily_ingest')
    
    # 2. Scout every 6 hours
    scheduler.add_job(job_scout_feed, 'interval', hours=6, id='scout_feed')
    
    # 3. Job expiry daily
    scheduler.add_job(job_expire_jobs, 'cron', hour=1, minute=0, id='job_expiry')
    
    scheduler.start()
    logger.info("APScheduler started successfully with scheduled crons.")
