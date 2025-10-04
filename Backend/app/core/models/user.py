# app/models/user.py
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'manager', 'employee')", name="check_user_role"),
    )

    # Relationships
    company = relationship("Company", back_populates="users")
    expenses = relationship("Expense", back_populates="employee", foreign_keys="Expense.employee_id")
    
    # Manager relationships
    managed_employees = relationship(
        "ManagerRelationship",
        foreign_keys="ManagerRelationship.manager_id",
        back_populates="manager",
        cascade="all, delete-orphan"
    )
    managers = relationship(
        "ManagerRelationship",
        foreign_keys="ManagerRelationship.employee_id",
        back_populates="employee",
        cascade="all, delete-orphan"
    )
    
    approvals = relationship("ExpenseApproval", back_populates="approver")
    audit_logs = relationship("AuditLog", back_populates="user")


class ManagerRelationship(Base):
    __tablename__ = "manager_relationships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("employee_id != manager_id", name="check_employee_not_manager"),
    )

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="managers")
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_employees")

