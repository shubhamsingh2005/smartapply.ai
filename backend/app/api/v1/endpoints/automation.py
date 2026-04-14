from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.automation import AutomationService
from app.services.audit import AuditLogger
from typing import Any, Dict

router = APIRouter()

@router.post("/start")
async def start_automation(
    job_url: str = Body(..., embed=True),
    erp_data: Dict[str, Any] = Body(..., embed=True),
    assets: Dict[str, Any] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Starts the human-in-the-loop automation process."""
    task_id = await AutomationService.start_application(job_url, erp_data, assets)
    
    AuditLogger.log(
        db, 
        "AUTOMATION", 
        "AUTOMATION_STARTED", 
        user_id=current_user.id, 
        metadata={"job_url": job_url, "task_id": task_id}
    )
    
    return {"task_id": task_id}

@router.get("/status/{task_id}")
async def get_automation_status(
    task_id: str, 
    current_user: User = Depends(get_current_user)
) -> Any:
    """Fetches real-time status and logs for an automation task."""
    task = AutomationService.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task.id,
        "status": task.status,
        "logs": task.logs,
        "interaction_required": task.interaction_required,
        "interaction_type": task.interaction_type,
        "screenshot": task.screenshot_path
    }

@router.post("/interact/{task_id}")
async def provide_interaction(
    task_id: str,
    data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Resumes automation after a user interaction (Captcha/Manual field)."""
    await AutomationService.provide_interaction(task_id, data)
    return {"message": "Resuming automation..."}
