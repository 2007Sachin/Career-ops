import os
import asyncio
from typing import Dict, Any, List
from playwright.async_api import Page, async_playwright
from agents.outreach.form_mapper import FormMapping
from supabase import create_client, Client

supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")

async def execute_form_fill(
    page: Page, 
    mapping: FormMapping, 
    mission_id: str, 
    session_id: str, 
    tailored_pdf_url: str
) -> Dict[str, Any]:
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Fill mapped fields
    for selector, action_data in mapping.mapped_fields.items():
        try:
            if action_data["type"] == "text":
                await page.fill(selector, action_data["value"])
            elif action_data["type"] == "file":
                # Assuming downloading PDF and uploading using page.set_input_files
                # Simplification for placeholder
                pass 
        except Exception as e:
            print(f"Error filling {selector}: {e}")
            
    if mapping.unmapped_fields:
        # Pause session, update mission, wait for HITL
        questions = [{"id": f.field_id, "label": f.label} for f in mapping.unmapped_fields]
        
        # update mission
        supabase.table("missions").update({
            "status": "awaiting_approval",
            "hitl_questions": questions
            # Session ID should theoretically be stored here too, but we can store it in hitl_responses or a new column
        }).eq("mission_id", mission_id).execute()
        
        return {"status": "paused_for_hitl", "questions": questions, "session_id": session_id}
        
    else:
        # Submit form
        try:
            submit_button = page.locator("button[type='submit'], input[type='submit'], button:has-text('Submit'), button:has-text('Apply')").first
            
            # Simple check if there's a captcha
            captcha = page.locator("iframe[src*='recaptcha'], iframe[src*='hcaptcha']")
            if await captcha.count() > 0:
                supabase.table("missions").update({"status": "awaiting_approval"}).eq("mission_id", mission_id).execute()
                return {"status": "captcha_detected", "session_id": session_id}
            
            if await submit_button.count() > 0:
                await submit_button.click()
                await page.wait_for_load_state("networkidle")
                
            supabase.table("missions").update({
                "status": "submitted"
            }).eq("mission_id", mission_id).execute()
            
            return {"status": "submitted", "session_id": session_id}
            
        except Exception as e:
            supabase.table("missions").update({"status": "failed"}).eq("mission_id", mission_id).execute()
            return {"status": "failed", "error": str(e), "session_id": session_id}

async def resume_hitl_and_submit(mission_id: str, hitl_responses: Dict[str, str], session_id: str) -> Dict[str, Any]:
    """
    Called when frontend submits HITL responses to resume session and submit.
    """
    supabase: Client = create_client(supabase_url, supabase_key)
    
    try:
        playwright = await async_playwright().start()
        connect_url = f"wss://connect.browserbase.com?apiKey={os.getenv('BROWSERBASE_API_KEY')}&sessionId={session_id}"
        browser = await playwright.chromium.connect_over_cdp(connect_url)
        
        contexts = browser.contexts
        if not contexts:
            raise Exception("No active contexts found for session")
            
        page = contexts[0].pages[0]
        
        for selector, value in hitl_responses.items():
            try:
                await page.fill(selector, value)
            except Exception as e:
                print(f"Error filling {selector}: {e}")
                
        submit_button = page.locator("button[type='submit'], input[type='submit'], button:has-text('Submit'), button:has-text('Apply')").first
        if await submit_button.count() > 0:
            await submit_button.click()
            await page.wait_for_load_state("networkidle")
            
        supabase.table("missions").update({
            "status": "submitted",
            "hitl_responses": hitl_responses
        }).eq("mission_id", mission_id).execute()
        
        # Cleanup browser and playwright
        await browser.close()
        await playwright.stop()
        
        return {"status": "submitted", "mission_id": mission_id}
        
    except Exception as e:
        supabase.table("missions").update({"status": "failed"}).eq("mission_id", mission_id).execute()
        return {"status": "failed", "error": str(e)}
