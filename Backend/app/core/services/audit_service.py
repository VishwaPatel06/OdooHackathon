# app/services/audit_service.py
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        company_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID,
        user_id: Optional[UUID] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Create an audit log entry"""
        audit_log = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit_log)
        db.commit()
        return audit_log

