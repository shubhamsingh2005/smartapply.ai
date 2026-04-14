from sqlalchemy import Column, String, JSON, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.base_class import Base

class AuditLog(Base):
    """
    Phase 8: Observability and Audit Trails.
    Tracks all critical system events for security and debugging.
    """
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    
    event_type = Column(String, index=True) # AUTH_LOGIN, PROFILE_UPDATE, AUTOMATION_START
    action = Column(String) # e.g., "User updated experience version 5"
    metadata_json = Column(JSON, default={}) # Contextual data (IP, browser, version_id)
    
    status = Column(String, default="SUCCESS") # SUCCESS, FAILURE, REJECTED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
