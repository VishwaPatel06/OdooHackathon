# app/services/approval_service.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.approval import ApprovalRule, ApproverSequence, ExpenseApproval
from app.models.expense import Expense
from app.models.user import User, ManagerRelationship
from app.schemas.approval import ApprovalRuleCreate, RuleType, ApprovalStatus
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class ApprovalService:
    @staticmethod
    def create_approval_rule(db: Session, company_id: UUID, rule_data: ApprovalRuleCreate) -> ApprovalRule:
        """Create a new approval rule with sequences"""
        rule = ApprovalRule(
            company_id=company_id,
            name=rule_data.name,
            rule_type=rule_data.rule_type,
            approval_percentage=rule_data.approval_percentage,
            specific_approver_id=rule_data.specific_approver_id,
            requires_manager_approval=rule_data.requires_manager_approval,
            min_amount=rule_data.min_amount,
            max_amount=rule_data.max_amount,
            priority=rule_data.priority
        )
        db.add(rule)
        db.flush()
        
        # Add approver sequences
        if rule_data.approver_sequences:
            for seq_data in rule_data.approver_sequences:
                sequence = ApproverSequence(
                    approval_rule_id=rule.id,
                    approver_id=seq_data.approver_id,
                    sequence_order=seq_data.sequence_order
                )
                db.add(sequence)
        
        db.commit()
        db.refresh(rule)
        return rule
    
    @staticmethod
    def get_applicable_rule(db: Session, company_id: UUID, amount: Decimal) -> Optional[ApprovalRule]:
        """Get the applicable approval rule based on amount"""
        rules = db.query(ApprovalRule).filter(
            ApprovalRule.company_id == company_id,
            ApprovalRule.is_active == True
        ).order_by(ApprovalRule.priority.desc()).all()
        
        for rule in rules:
            # Check if amount falls within rule's range
            if rule.min_amount is not None and amount < rule.min_amount:
                continue
            if rule.max_amount is not None and amount > rule.max_amount:
                continue
            return rule
        
        return None
    
    @staticmethod
    def create_expense_approvals(
        db: Session, 
        expense: Expense, 
        rule: ApprovalRule
    ) -> List[ExpenseApproval]:
        """Create approval records for an expense based on the rule"""
        approvals = []
        
        # If requires manager approval, add manager as first approver
        if rule.requires_manager_approval:
            manager_rel = db.query(ManagerRelationship).filter(
                ManagerRelationship.employee_id == expense.employee_id
            ).first()
            
            if manager_rel:
                approval = ExpenseApproval(
                    expense_id=expense.id,
                    approver_id=manager_rel.manager_id,
                    sequence_order=0,
                    status=ApprovalStatus.PENDING
                )
                db.add(approval)
                approvals.append(approval)
        
        # Add approvers from sequence
        sequences = db.query(ApproverSequence).filter(
            ApproverSequence.approval_rule_id == rule.id
        ).order_by(ApproverSequence.sequence_order).all()
        
        offset = 1 if rule.requires_manager_approval else 0
        
        for seq in sequences:
            approval = ExpenseApproval(
                expense_id=expense.id,
                approver_id=seq.approver_id,
                sequence_order=seq.sequence_order + offset,
                status=ApprovalStatus.PENDING
            )
            db.add(approval)
            approvals.append(approval)
        
        db.commit()
        return approvals
    
    @staticmethod
    def process_approval_action(
        db: Session,
        approval: ExpenseApproval,
        action: str,
        comments: Optional[str] = None
    ) -> dict:
        """Process an approval/rejection action"""
        if approval.status != ApprovalStatus.PENDING:
            return {"success": False, "message": "Approval already processed"}
        
        # Update approval record
        approval.status = ApprovalStatus.APPROVED if action == "approve" else ApprovalStatus.REJECTED
        approval.comments = comments
        approval.approved_at = datetime.utcnow()
        
        expense = approval.expense
        
        if action == "reject":
            # Reject the entire expense
            expense.status = "rejected"
            db.commit()
            return {"success": True, "message": "Expense rejected", "expense_status": "rejected"}
        
        # Check if this is sequential approval
        all_approvals = db.query(ExpenseApproval).filter(
            ExpenseApproval.expense_id == expense.id
        ).order_by(ExpenseApproval.sequence_order).all()
        
        # Find the applicable rule to check rule type
        rule = ApprovalService.get_applicable_rule(db, expense.company_id, expense.company_amount)
        
        if rule and rule.rule_type == RuleType.SEQUENTIAL:
            # Sequential: Check if all previous approvals are done
            for appr in all_approvals:
                if appr.sequence_order < approval.sequence_order and appr.status == ApprovalStatus.PENDING:
                    db.commit()
                    return {"success": False, "message": "Previous approvals must be completed first"}
            
            # Check if all approvals are done
            if all(a.status == ApprovalStatus.APPROVED for a in all_approvals):
                expense.status = "approved"
                db.commit()
                return {"success": True, "message": "Expense approved", "expense_status": "approved"}
            
            db.commit()
            return {"success": True, "message": "Approval recorded", "expense_status": "pending"}
        
        elif rule and rule.rule_type == RuleType.SPECIFIC_APPROVER:
            # Specific approver: If this approver approves, expense is approved
            if approval.approver_id == rule.specific_approver_id:
                expense.status = "approved"
                # Mark other approvals as skipped
                for appr in all_approvals:
                    if appr.id != approval.id and appr.status == ApprovalStatus.PENDING:
                        appr.status = ApprovalStatus.SKIPPED
                db.commit()
                return {"success": True, "message": "Expense auto-approved", "expense_status": "approved"}
        
        elif rule and rule.rule_type in [RuleType.PERCENTAGE, RuleType.HYBRID]:
            # Calculate approval percentage
            approved_count = sum(1 for a in all_approvals if a.status == ApprovalStatus.APPROVED)
            total_count = len(all_approvals)
            approval_pct = (approved_count / total_count * 100) if total_count > 0 else 0
            
            # Check specific approver for hybrid
            specific_approved = False
            if rule.rule_type == RuleType.HYBRID and rule.specific_approver_id:
                specific_approved = any(
                    a.approver_id == rule.specific_approver_id and a.status == ApprovalStatus.APPROVED
                    for a in all_approvals
                )
            
            # Check if threshold met
            percentage_met = rule.approval_percentage and approval_pct >= float(rule.approval_percentage)
            
            if percentage_met or specific_approved:
                expense.status = "approved"
                # Mark remaining as skipped
                for appr in all_approvals:
                    if appr.status == ApprovalStatus.PENDING:
                        appr.status = ApprovalStatus.SKIPPED
                db.commit()
                return {"success": True, "message": "Expense approved", "expense_status": "approved"}
        
        db.commit()
        return {"success": True, "message": "Approval recorded", "expense_status": "pending"}

