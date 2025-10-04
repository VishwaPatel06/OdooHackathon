# app/models/approval.py
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Integer, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    rule_type = Column(String(50), nullable=False)
    approval_percentage = Column(Numeric(5, 2))
    specific_approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    requires_manager_approval = Column(Boolean, default=False)
    min_amount = Column(Numeric(15, 2))
    max_amount = Column(Numeric(15, 2))
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "rule_type IN ('percentage', 'specific_approver', 'hybrid', 'sequential')",
            name="check_rule_type"
        ),
    )

    # Relationships
    company = relationship("Company", back_populates="approval_rules")
    specific_approver = relationship("User", foreign_keys=[specific_approver_id])
    approver_sequences = relationship("ApproverSequence", back_populates="rule", cascade="all, delete-orphan")


class ApproverSequence(Base):
    __tablename__ = "approver_sequences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    approval_rule_id = Column(UUID(as_uuid=True), ForeignKey("approval_rules.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sequence_order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    rule = relationship("ApprovalRule", back_populates="approver_sequences")
    approver = relationship("User")


class ExpenseApproval(Base):
    __tablename__ = "expense_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sequence_order = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    comments = Column(Text)
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'skipped')",
            name="check_approval_status"
        ),
    )

    # Relationships
    expense = relationship("Expense", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")

