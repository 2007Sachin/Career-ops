import traceback
from typing import Dict, Any

from shared.supabase_client import supabase
from agents.outreach.session_manager import create_browserbase_session
from agents.outreach.form_mapper import map_application_form
from agents.outreach.executor import execute_form_fill


async def run_outreach_pipeline(mission_id: str) -> Dict[str, Any]:
    # PK is "id", not "mission_id"
    res = (
        supabase.table("missions")
        .select("*, users(*), jobs(*)")
        .eq("id", mission_id)
        .single()
        .execute()
    )
    if not res.data:
        raise Exception("Mission not found")

    mission = res.data
    job = mission.get("jobs") or {}
    user = mission.get("users") or {}
    source_url = job.get("source_url")
    pdf_url = mission.get("tailored_pdf_url")

    if not source_url:
        raise Exception("Job source URL missing")

    browser = None
    playwright = None

    try:
        session, browser, playwright = await create_browserbase_session()
        session_id = session.id

        context = browser.contexts[0] if browser.contexts else await browser.new_context()
        page = context.pages[0] if context.pages else await context.new_page()

        mapping = await map_application_form(page, source_url, user)

        result = await execute_form_fill(
            page=page,
            mapping=mapping,
            mission_id=mission_id,
            session_id=session_id,
            tailored_pdf_url=pdf_url,
        )

        return result

    except Exception as e:
        print(f"Outreach Pipeline Error: {traceback.format_exc()}")
        # PK is "id"
        supabase.table("missions").update({"status": "failed"}).eq("id", mission_id).execute()
        return {"status": "error", "message": str(e)}

    finally:
        if browser:
            await browser.close()
        if playwright:
            await playwright.stop()
