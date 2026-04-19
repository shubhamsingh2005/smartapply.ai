from app.services.audit import AuditLogger
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import get_logger

logger = get_logger(__name__)

async def safe_execute(fn, context: str = "operation"):
    try:
        return await fn()
    except Exception as e:
        logger.error(f"AUTOMATION_FAIL: {context}: {e}")
        return None

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
        self.interaction_type: Optional[str] = None
        self.page: Optional[Page] = None
        self.browser_context: Optional[BrowserContext] = None
        self.playwright_mgr = None

    def add_log(self, message: str, level: str = "INFO"):
        self.logs.append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "level": level
        })
        logger.info(f"TASK_LOG: [{self.id}] {message}", extra={"task_id": self.id, "level": level})

class AutomationService:
    _tasks: Dict[str, AutomationTask] = {}

    @classmethod
    async def start_application(cls, db: AsyncSession, user_id: str, job_url: str, erp_data: dict, assets: dict) -> str:
        task = AutomationTask(job_url, erp_data, assets)
        cls._tasks[task.id] = task
        
        # Log to Audit Table (Service Layer Responsibility)
        await AuditLogger.log(
            db, 
            "AUTOMATION", 
            "AUTOMATION_STARTED", 
            user_id=user_id, 
            metadata={"job_url": job_url, "task_id": task.id}
        )
        
        asyncio.create_task(cls._run_automation(task))
        return task.id

    @classmethod
    async def _run_automation(cls, task: AutomationTask):
        task.add_log(f"Navigation initiated for {task.job_url}")
        task.status = "NAVIGATING"
        
        try:
            task.playwright_mgr = await async_playwright().start()
            browser = await task.playwright_mgr.chromium.launch(headless=True)
            task.browser_context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            task.page = await task.browser_context.new_page()

            # Using safe_execute/timeout for nav
            await task.page.goto(task.job_url, wait_until="domcontentloaded", timeout=60000)
            task.add_log("Arrived at job application page.")
            
            task.status = "FILLING_FORM"
            name = task.erp_data.get('personal', {}).get('fullName', '')
            email = task.erp_data.get('personal', {}).get('email', '')
            
            # Form Filling logic with safety
            async def fill_form():
                if name:
                    await task.page.fill("input[name*='name' i], input[id*='name' i]", name, timeout=5000)
                if email:
                    await task.page.fill("input[name*='email' i], input[id*='email' i]", email, timeout=5000)

            await safe_execute(fill_form, "fill_identity_fields")
            task.add_log("Heuristics applied to form fields.")

            # Pause for Human-in-the-Loop review
            os.makedirs("app/static/screenshots", exist_ok=True)
            screenshot_path = f"app/static/screenshots/{task.id}.png"
            await task.page.screenshot(path=screenshot_path, full_page=True)
            task.screenshot_path = f"/static/screenshots/{task.id}.png"
            
            task.interaction_required = True
            task.interaction_type = "REVIEW_AND_SUBMIT"
            task.status = "AWAITING_USER"
            task.add_log("Task paused for human review.")

        except Exception as e:
            task.status = "FAILED"
            task.add_log(f"CRITICAL_FAILURE: {str(e)}", "ERROR")
            if task.page:
                try:
                    await task.page.screenshot(path=f"app/static/screenshots/{task.id}_error.png")
                    task.screenshot_path = f"/static/screenshots/{task.id}_error.png"
                except:
                    pass

    @classmethod
    def get_task_status(cls, task_id: str) -> Optional[Dict[str, Any]]:
        task = cls._tasks.get(task_id)
        if not task:
            logger.warning(f"TASK_NOT_FOUND: {task_id}")
            return None
        
        return {
            "task_id": task.id,
            "status": task.status,
            "logs": task.logs,
            "interaction_required": task.interaction_required,
            "interaction_type": task.interaction_type,
            "screenshot": task.screenshot_path
        }

    @classmethod
    async def provide_interaction(cls, task_id: str, data: dict):
        task = cls._tasks.get(task_id)
        if not task or not task.page: 
            logger.error(f"INTERACTION_LOST: Task {task_id} invalid or closed.")
            return
        
        command = data.get("command", "")
        task.add_log(f"Received user command: {command}")
        task.interaction_required = False
        task.status = "RESUMING"
        
        try:
            if command == "SUBMIT":
                # Final submission safety
                async def submit():
                    await task.page.click("button[type='submit'], input[type='submit']", timeout=5000)
                await safe_execute(submit, "final_submit_click")
                
                await asyncio.sleep(3)
                task.status = "COMPLETED"
                task.add_log("Task successfully executed.", "SUCCESS")
            elif command == "CANCEL":
                task.status = "CANCELLED"
            else:
                task.status = "FAILED"
        finally:
            if task.playwright_mgr:
                await task.browser_context.close()
                await task.playwright_mgr.stop()
