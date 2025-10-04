# app/schemas/approval.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from enum import Enum


class RuleType(str, Enum):
    PERCENTAGE = "percentage"
    SPECIFIC_APPROVER = "specific_approver"
    HYBRID = "hybrid"
    SEQUENTIAL = "sequential"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class ApproverSequenceBase(BaseModel):
    approver_id: UUID
    sequence_order: int = Field(..., ge=1)


class ApproverSequenceCreate(ApproverSequenceBase):
    pass


class ApproverSequence(ApproverSequenceBase):
    id: UUID
    approval_rule_id: UUID
    created_at: datetime
    approver_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    rule_type: RuleType
    approval_percentage: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    specific_approver_id: Optional[UUID] = None
    requires_manager_approval: bool = False
    min_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    max_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    priority: int = Field(default=0, ge=0)

    @field_validator('approval_percentage')
    def validate_percentage(cls, v, info):
        if info.data.get('rule_type') in [RuleType.PERCENTAGE, RuleType.HYBRID] and v is None:
            raise ValueError('approval_percentage is required for percentage and hybrid rules')
        return v

    @field_validator('specific_approver_id')
    def validate_specific_approver(cls, v, info):
        if info.data.get('rule_type') in [RuleType.SPECIFIC_APPROVER, RuleType.HYBRID] and v is None:
            raise ValueError('specific_approver_id is required for specific_approver and hybrid rules')
        return v


class ApprovalRuleCreate(ApprovalRuleBase):
    approver_sequences: Optional[List[ApproverSequenceCreate]] = []


class ApprovalRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0)


class ApprovalRule(ApprovalRuleBase):
    id: UUID
    company_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApprovalRuleWithSequences(ApprovalRule):
    approver_sequences: List[ApproverSequence] = []


class ExpenseApprovalBase(BaseModel):
    comments: Optional[str] = Field(None, max_length=1000)


class ExpenseApprovalAction(ExpenseApprovalBase):
    action: str = Field(..., pattern="^(approve|reject)$")


class ExpenseApprovalResponse(BaseModel):
    id: UUID
    expense_id: UUID
    approver_id: UUID
    approver_name: str
    sequence_order: int
    status: ApprovalStatus
    comments: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

