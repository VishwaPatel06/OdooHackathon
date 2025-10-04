# app/services/expense_service.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.expense import Expense, ExpenseLine, ExpenseCategory
from app.schemas.expense import ExpenseCreate, ExpenseStatus
from app.services.currency_service import CurrencyService
from app.services.approval_service import ApprovalService
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class ExpenseService:
    @staticmethod
    async def create_expense(
        db: Session,
        company_id: UUID,
        employee_id: UUID,
        expense_data: ExpenseCreate,
        company_currency: str
    ) -> Expense:
        """Create a new expense with currency conversion"""
        # Convert amount to company currency
        exchange_rate = await CurrencyService.get_exchange_rate(
            expense_data.submitted_currency,
            company_currency
        )
        
        if exchange_rate is None:
            raise ValueError("Unable to fetch exchange rate")
        
        company_amount = await CurrencyService.convert_amount(
            expense_data.submitted_amount,
            expense_data.submitted_currency,
            company_currency
        )
        
        # Generate expense number
        count = db.query(Expense).filter(Expense.company_id == company_id).count()
        expense_number = f"EXP-{datetime.utcnow().strftime('%Y%m')}-{count + 1:05d}"
        
        # Create expense
        expense = Expense(
            company_id=company_id,
            employee_id=employee_id,
            expense_number=expense_number,
            title=expense_data.title,
            description=expense_data.description,
            expense_date=expense_data.expense_date,
            submitted_currency=expense_data.submitted_currency,
            submitted_amount=expense_data.submitted_amount,
            company_currency=company_currency,
            company_amount=company_amount,
            exchange_rate=exchange_rate,
            status=ExpenseStatus.DRAFT,
            receipt_filename=expense_data.receipt_filename
        )
        db.add(expense)
        db.flush()
        
        # Create expense lines
        for idx, line_data in enumerate(expense_data.expense_lines):
            line = ExpenseLine(
                expense_id=expense.id,
                category_id=line_data.category_id,
                description=line_data.description,
                amount=line_data.amount,
                merchant_name=line_data.merchant_name,
                line_order=idx + 1
            )
            db.add(line)
        
        db.commit()
        db.refresh(expense)
        return expense
    
    @staticmethod
    def submit_expense(db: Session, expense: Expense) -> Expense:
        """Submit expense for approval"""
        expense.status = ExpenseStatus.PENDING
        expense.submitted_at = datetime.utcnow()
        
        # Get applicable approval rule and create approvals
        rule = ApprovalService.get_applicable_rule(db, expense.company_id, expense.company_amount)
        
        if rule:
            ApprovalService.create_expense_approvals(db, expense, rule)
        else:
            # No rule found, auto-approve
            expense.status = ExpenseStatus.APPROVED
        
        db.commit()
        db.refresh(expense)
        return expense