# app/models/expense.py
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Numeric, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="categories")
    expense_lines = relationship("ExpenseLine", back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expense_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    expense_date = Column(Date, nullable=False)
    
    # Currency fields
    submitted_currency = Column(String(3), nullable=False)
    submitted_amount = Column(Numeric(15, 2), nullable=False)
    company_currency = Column(String(3), nullable=False)
    company_amount = Column(Numeric(15, 2), nullable=False)
    exchange_rate = Column(Numeric(10, 6), nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default="pending")
    
    # Receipt
    receipt_url = Column(Text)
    receipt_filename = Column(String(255))
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')",
            name="check_expense_status"
        ),
    )

    # Relationships
    company = relationship("Company", back_populates="expenses")
    employee = relationship("User", back_populates="expenses", foreign_keys=[employee_id])
    expense_lines = relationship("ExpenseLine", back_populates="expense", cascade="all, delete-orphan")
    approvals = relationship("ExpenseApproval", back_populates="expense", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="expense")


class ExpenseLine(Base):
    __tablename__ = "expense_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.id", ondelete="SET NULL"))
    description = Column(Text, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    merchant_name = Column(String(255))
    line_order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    expense = relationship("Expense", back_populates="expense_lines")
    category = relationship("ExpenseCategory", back_populates="expense_lines")

