import os
from browserbase import Browserbase
from playwright.async_api import async_playwright, Browser, Playwright
from typing import Tuple, Dict, Any

browserbase_api_key = os.getenv("BROWSERBASE_API_KEY", "")
browserbase_project_id = os.getenv("BROWSERBASE_PROJECT_ID", "")

# We initialize a singleton client or instantiate when needed
bb = Browserbase(api_key=browserbase_api_key)

async def create_browserbase_session() -> Tuple[Dict[str, Any], Browser, Playwright]:
    """
    Initializes a Browserbase session with Playwright.
    Configures residential proxy, stealth mode, session recording, and timeouts.
    Returns the session object, the playwright browser instance, and the playwright context.
    """
    if not browserbase_api_key or not browserbase_project_id:
        raise ValueError("BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set")
        
    session = bb.sessions.create(
        project_id=browserbase_project_id,
        proxies=True, # Residential proxy rotation
        browser_settings={
            "stealth": True, # Avoid bot detection
            "recordSession": True, # Audit trail
            "timeout": 120000 # 120s timeout
        }
    )
    
    playwright = await async_playwright().start()
    
    # connect_url usually is provided by session.connect_url
    # Fallback to manual wss if not provided
    connect_url = getattr(session, 'connect_url', f"wss://connect.browserbase.com?apiKey={browserbase_api_key}&sessionId={session.id}")
    
    browser = await playwright.chromium.connect_over_cdp(connect_url)
    
    return session, browser, playwright
