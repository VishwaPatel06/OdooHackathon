
# app/api/v1/expenses.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense, ExpenseLine
from app.models.company import Company
from app.schemas.expense import (
    ExpenseCreate, Expense as ExpenseSchema, 
    ExpenseWithDetails, ExpenseStatus, ExpenseCategory
)
from app.services.expense_service import ExpenseService
from app.services.audit_service import AuditService
from typing import List, Optional
from uuid import UUID
import os
import shutil
from pathlib import Path

router = APIRouter()


@router.post("/", response_model=ExpenseSchema, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new expense"""
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    
    expense = await ExpenseService.create_expense(
        db=db,
        company_id=current_user.company_id,
        employee_id=current_user.id,
        expense_data=expense_data,
        company_currency=company.currency_code
    )
    
    AuditService.log_action(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="expense_created",
        entity_type="expense",
        entity_id=expense.id,
        new_value={"expense_number": expense.expense_number, "amount": float(expense.company_amount)}
    )
    
    return expense


@router.post("/{expense_id}/submit", response_model=ExpenseSchema)
def submit_expense(
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit expense for approval"""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.employee_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    if expense.status != ExpenseStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft expenses can be submitted"
        )
    
    expense = ExpenseService.submit_expense(db, expense)
    
    AuditService.log_action(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="expense_submitted",
        entity_type="expense",
        entity_id=expense.id
    )
    
    return expense


@router.get("/", response_model=List[ExpenseWithDetails])
def get_my_expenses(
    status: Optional[ExpenseStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's expenses"""
    query = db.query(Expense).filter(Expense.employee_id == current_user.id)
    
    if status:
        query = query.filter(Expense.status == status)
    
    expenses = query.order_by(Expense.created_at.desc()).all()
    
    result = []
    for expense in expenses:
        expense_dict = ExpenseWithDetails.model_validate(expense)
        expense_dict.employee_name = current_user.full_name
        result.append(expense_dict)
    
    return result


@router.get("/{expense_id}", response_model=ExpenseWithDetails)
def get_expense(
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get expense details"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Check access rights
    if current_user.role == "employee" and expense.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this expense"
        )
    
    if expense.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this expense"
        )
    
    expense_dict = ExpenseWithDetails.model_validate(expense)
    expense_dict.employee_name = expense.employee.full_name
    
    return expense_dict


@router.get("/categories/list", response_model=List[ExpenseCategory])
def get_expense_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all expense categories for the company"""
    from app.models.expense import ExpenseCategory as ExpenseCategoryModel
    
    categories = db.query(ExpenseCategoryModel).filter(
        ExpenseCategoryModel.company_id == current_user.company_id,
        ExpenseCategoryModel.is_active == True
    ).all()
    
    return categories


