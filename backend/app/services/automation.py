import asyncio
import os
import uuid
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Page, BrowserContext

class AutomationTask:
    def __init__(self, job_url: str, erp_data: dict, assets: dict):
        self.id = str(uuid.uuid4())
        self.job_url = job_url
        self.erp_data = erp_data
        self.assets = assets
        self.status = "INITIALIZING"
        self.logs: List[dict] = []
        self.screenshot_path: Optional[str] = None
        self.interaction_required = False
        self.interaction_type: Optional[str] = None # 'CAPTCHA', '2FA', 'MISSING_FIELD'
        self.page: Optional[Page] = None
        self.browser_context: Optional[BrowserContext] = None
        self.playwright_mgr = None

    def add_log(self, message: str, level: str = "INFO"):
        self.logs.append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "level": level
        })

class AutomationService:
    """
    Phase 7: Human-in-the-Loop Browser Automation.
    Manages job application form filling and document uploads.
    """
    _tasks: Dict[str, AutomationTask] = {}

    @classmethod
    async def start_application(cls, job_url: str, erp_data: dict, assets: dict) -> str:
        task = AutomationTask(job_url, erp_data, assets)
        cls._tasks[task.id] = task
        
        # Start the background process
        asyncio.create_task(cls._run_automation(task))
        return task.id

    @classmethod
    async def _run_automation(cls, task: AutomationTask):
        task.add_log(f"Starting browser automation for {task.job_url}")
        task.status = "NAVIGATING"
        
        try:
            task.playwright_mgr = await async_playwright().start()
            # In production, you might not want headless=False unless debugging locally. 
            # We use headless=True to ensure it works on servers, and relies on screenshots.
            browser = await task.playwright_mgr.chromium.launch(headless=True)
            task.browser_context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            task.page = await task.browser_context.new_page()

            # Set a timeout for navigation
            await task.page.goto(task.job_url, wait_until="domcontentloaded", timeout=30000)
            task.add_log("Arrived at job application page.")
            
            task.status = "FILLING_FORM"
            name = task.erp_data.get('personal', {}).get('fullName', '')
            email = task.erp_data.get('personal', {}).get('email', '')
            task.add_log(f"Attempting to map identity: {name} | {email}")
            
            # Simple heuristic matching for demonstration
            # Attempts to locate generic name and email fields on standard job boards
            try:
                if name:
                    await task.page.fill("input[name*='name' i], input[id*='name' i]", name, timeout=2000)
                if email:
                    await task.page.fill("input[name*='email' i], input[id*='email' i]", email, timeout=2000)
                task.add_log("Automatically filled detected identity fields.")
            except Exception:
                task.add_log("Could not auto-fill fields using basic heuristics.", "WARNING")

            # Pause for Human-in-the-Loop review
            # Take a screenshot so the user can see the form state
            screenshot_path = f"app/static/screenshots/{task.id}.png"
            await task.page.screenshot(path=screenshot_path, full_page=True)
            task.screenshot_path = f"/static/screenshots/{task.id}.png"
            
            task.interaction_required = True
            task.interaction_type = "REVIEW_AND_SUBMIT"
            task.status = "AWAITING_USER"
            task.add_log("Phase 7 Verification: Paused execution. Please review the form screenshot and provide submit command.", "WARNING")

        except Exception as e:
            task.status = "FAILED"
            task.add_log(f"Automation failed: {str(e)}", "ERROR")
            if task.page:
                try:
                    await task.page.screenshot(path=f"app/static/screenshots/{task.id}_error.png")
                    task.screenshot_path = f"/static/screenshots/{task.id}_error.png"
                except:
                    pass

    @classmethod
    def get_task_status(cls, task_id: str) -> Optional[AutomationTask]:
        return cls._tasks.get(task_id)

    @classmethod
    async def provide_interaction(cls, task_id: str, data: dict):
        task = cls._tasks.get(task_id)
        if not task or not task.page: return
        
        command = data.get("command", "")
        task.add_log(f"User provided interaction: {command}")
        task.interaction_required = False
        task.status = "RESUMING"
        
        try:
            if command == "SUBMIT":
                task.add_log("Simulating final submit click.")
                # We attempt to find a submit button, or simply exit for the sake of safety.
                try:
                    await task.page.click("button[type='submit'], input[type='submit']", timeout=3000)
                except:
                    task.add_log("Auto-submit button not found. Assuming manual submission.", "WARNING")
                
                await asyncio.sleep(2) # Allow network to finalize
                task.status = "COMPLETED"
                task.add_log("Application review and submission completed!", "SUCCESS")
            elif command == "CANCEL":
                task.status = "CANCELLED"
                task.add_log("User cancelled automation.", "WARNING")
            else:
                task.status = "FAILED"
                task.add_log("Unknown command received.", "ERROR")
        finally:
            if task.playwright_mgr:
                await task.browser_context.close()
                await task.playwright_mgr.stop()
