from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Starts the human-in-the-loop automation process via Service Layer."""
    task_id = await AutomationService.start_application(db, current_user.id, job_url, erp_data, assets)
    return {"task_id": task_id}

@router.get("/status/{task_id}")
async def get_automation_status(
    task_id: str, 
    current_user: User = Depends(get_current_user)
) -> Any:
    """Fetches real-time status via Service Layer."""
    status = AutomationService.get_task_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    return status

@router.post("/interact/{task_id}")
async def provide_interaction(
    task_id: str,
    data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delegates interaction to Service Layer."""
    await AutomationService.provide_interaction(task_id, data)
    return {"message": "Resuming automation..."}
