# app/schemas/expense.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal
from enum import Enum


class ExpenseStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ExpenseLineBase(BaseModel):
    category_id: Optional[UUID] = None
    description: str = Field(..., min_length=1, max_length=1000)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    merchant_name: Optional[str] = Field(None, max_length=255)


class ExpenseLineCreate(ExpenseLineBase):
    pass


class ExpenseLine(ExpenseLineBase):
    id: UUID
    expense_id: UUID
    line_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategory(ExpenseCategoryBase):
    id: UUID
    company_id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    expense_date: date
    submitted_currency: str = Field(..., min_length=3, max_length=3)
    submitted_amount: Decimal = Field(..., gt=0, decimal_places=2)


class ExpenseCreate(ExpenseBase):
    expense_lines: List[ExpenseLineCreate] = Field(..., min_items=1)
    receipt_filename: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    expense_date: Optional[date] = None
    status: Optional[ExpenseStatus] = None


class Expense(ExpenseBase):
    id: UUID
    company_id: UUID
    employee_id: UUID
    expense_number: str
    company_currency: str
    company_amount: Decimal
    exchange_rate: Decimal
    status: ExpenseStatus
    receipt_url: Optional[str] = None
    receipt_filename: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseWithDetails(Expense):
    employee_name: str
    expense_lines: List[ExpenseLine] = []
    approvals: List["ExpenseApprovalResponse"] = []

