# app/api/v1/approvals.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.approval import ExpenseApproval
from app.models.expense import Expense
from app.schemas.approval import (
    ExpenseApprovalAction, ExpenseApprovalResponse
)
from app.schemas.expense import ExpenseWithDetails
from app.services.approval_service import ApprovalService
from app.services.audit_service import AuditService
from typing import List
from uuid import UUID

router = APIRouter()


@router.get("/pending", response_model=List[ExpenseWithDetails])
def get_pending_approvals(
    current_user: User = Depends(require_role("manager", "admin")),
    db: Session = Depends(get_db)
):
    """Get expenses waiting for current user's approval"""
    pending_approvals = db.query(ExpenseApproval).filter(
        ExpenseApproval.approver_id == current_user.id,
        ExpenseApproval.status == "pending"
    ).all()
    
    expense_ids = [approval.expense_id for approval in pending_approvals]
    
    expenses = db.query(Expense).filter(
        Expense.id.in_(expense_ids),
        Expense.status == "pending"
    ).order_by(Expense.submitted_at.desc()).all()
    
    result = []
    for expense in expenses:
        expense_dict = ExpenseWithDetails.model_validate(expense)
        expense_dict.employee_name = expense.employee.full_name
        result.append(expense_dict)
    
    return result


@router.post("/{approval_id}/action", response_model=dict)
def process_approval(
    approval_id: UUID,
    action_data: ExpenseApprovalAction,
    current_user: User = Depends(require_role("manager", "admin")),
    db: Session = Depends(get_db)
):
    """Approve or reject an expense"""
    approval = db.query(ExpenseApproval).filter(
        ExpenseApproval.id == approval_id,
        ExpenseApproval.approver_id == current_user.id
    ).first()
    
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )
    
    result = ApprovalService.process_approval_action(
        db=db,
        approval=approval,
        action=action_data.action,
        comments=action_data.comments
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    AuditService.log_action(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        expense_id=approval.expense_id,
        action=f"expense_{action_data.action}",
        entity_type="expense_approval",
        entity_id=approval.id,
        new_value={"action": action_data.action, "comments": action_data.comments}
    )
    
    return result

