from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from typing import Optional, Any, Dict

class AuditLogger:
    @staticmethod
    async def log(
        db: AsyncSession,
        event_type: str,
        action: str,
        user_id: Optional[Any] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "SUCCESS"
    ):
        """
        Records an event in the centralized audit log asynchronously.
        """
        try:
            log_entry = AuditLog(
                user_id=user_id,
                event_type=event_type,
                action=action,
                metadata_json=metadata or {},
                status=status
            )
            db.add(log_entry)
            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"FAILED TO WRITE AUDIT LOG: {str(e)}")
