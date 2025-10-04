# app/tests/test_approval_logic.py
import pytest
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.company import Company
from app.models.user import User
from app.models.expense import Expense, ExpenseCategory
from app.models.approval import ApprovalRule, ApproverSequence, ExpenseApproval
from app.schemas.approval import RuleType, ApprovalStatus
from app.services.approval_service import ApprovalService
from app.core.security import get_password_hash


@pytest.fixture
def db_session():
    """Create a test database session"""
    # This would use a test database in actual implementation
    pass


@pytest.fixture
def test_company(db_session):
    """Create a test company"""
    company = Company(
        name="Test Corp",
        country="USA",
        currency_code="USD"
    )
    db_session.add(company)
    db_session.commit()
    return company


@pytest.fixture
def test_users(db_session, test_company):
    """Create test users"""
    admin = User(
        company_id=test_company.id,
        email="admin@test.com",
        password_hash=get_password_hash("password"),
        full_name="Admin User",
        role="admin"
    )
    
    manager1 = User(
        company_id=test_company.id,
        email="manager1@test.com",
        password_hash=get_password_hash("password"),
        full_name="Manager One",
        role="manager"
    )
    
    manager2 = User(
        company_id=test_company.id,
        email="manager2@test.com",
        password_hash=get_password_hash("password"),
        full_name="Manager Two",
        role="manager"
    )
    
    employee = User(
        company_id=test_company.id,
        email="employee@test.com",
        password_hash=get_password_hash("password"),
        full_name="Test Employee",
        role="employee"
    )
    
    db_session.add_all([admin, manager1, manager2, employee])
    db_session.commit()
    
    return {
        "admin": admin,
        "manager1": manager1,
        "manager2": manager2,
        "employee": employee
    }


class TestSequentialApproval:
    """Test sequential approval workflow"""
    
    def test_sequential_approval_order(self, db_session, test_company, test_users):
        """Test that approvals must happen in sequence"""
        # Create sequential approval rule
        rule = ApprovalRule(
            company_id=test_company.id,
            name="Sequential Rule",
            rule_type=RuleType.SEQUENTIAL,
            min_amount=Decimal("0"),
            max_amount=Decimal("1000")
        )
        db_session.add(rule)
        db_session.flush()
        
        # Add approver sequence
        seq1 = ApproverSequence(
            approval_rule_id=rule.id,
            approver_id=test_users["manager1"].id,
            sequence_order=1
        )
        seq2 = ApproverSequence(
            approval_rule_id=rule.id,
            approver_id=test_users["manager2"].id,
            sequence_order=2
        )
        db_session.add_all([seq1, seq2])
        
        # Create expense
        expense = Expense(
            company_id=test_company.id,
            employee_id=test_users["employee"].id,
            expense_number="EXP-TEST-001",
            title="Test Expense",
            expense_date="2024-10-01",
            submitted_currency="USD",
            submitted_amount=Decimal("500"),
            company_currency="USD",
            company_amount=Decimal("500"),
            exchange_rate=Decimal("1"),
            status="pending"
        )
        db_session.add(expense)
        db_session.commit()
        
        # Create approval records
        approvals = ApprovalService.create_expense_approvals(db_session, expense, rule)
        
        # Try to approve out of order (second approver first)
        result = ApprovalService.process_approval_action(
            db_session,
            approvals[1],
            "approve"
        )
        
        assert result["success"] == False
        assert "previous approvals" in result["message"].lower()
        
        # Approve in correct order
        result1 = ApprovalService.process_approval_action(
            db_session,
            approvals[0],
            "approve"
        )
        assert result1["success"] == True
        
        result2 = ApprovalService.process_approval_action(
            db_session,
            approvals[1],
            "approve"
        )
        assert result2["success"] == True
        assert result2["expense_status"] == "approved"


class TestPercentageApproval:
    """Test percentage-based approval"""
    
    def test_percentage_threshold_met(self, db_session, test_company, test_users):
        """Test approval when percentage threshold is met"""
        # Create 60% approval rule
        rule = ApprovalRule(
            company_id=test_company.id,
            name="60% Rule",
            rule_type=RuleType.PERCENTAGE,
            approval_percentage=Decimal("60.00"),
            min_amount=Decimal("0"),
            max_amount=Decimal("5000")
        )
        db_session.add(rule)
        db_session.flush()
        
        # Add 3 approvers (need 2 out of 3 = 66.67%)
        approvers = [test_users["admin"], test_users["manager1"], test_users["manager2"]]
        for idx, approver in enumerate(approvers):
            seq = ApproverSequence(
                approval_rule_id=rule.id,
                approver_id=approver.id,
                sequence_order=idx + 1
            )
            db_session.add(seq)
        
        expense = Expense(
            company_id=test_company.id,
            employee_id=test_users["employee"].id,
            expense_number="EXP-TEST-002",
            title="Test Expense",
            expense_date="2024-10-01",
            submitted_currency="USD",
            submitted_amount=Decimal("2000"),
            company_currency="USD",
            company_amount=Decimal("2000"),
            exchange_rate=Decimal("1"),
            status="pending"
        )
        db_session.add(expense)
        db_session.commit()
        
        approvals = ApprovalService.create_expense_approvals(db_session, expense, rule)
        
        # First approval - should not auto-approve
        result1 = ApprovalService.process_approval_action(
            db_session,
            approvals[0],
            "approve"
        )
        assert result1["expense_status"] == "pending"
        
        # Second approval - should auto-approve (66.67% > 60%)
        result2 = ApprovalService.process_approval_action(
            db_session,
            approvals[1],
            "approve"
        )
        assert result2["expense_status"] == "approved"
        
        # Third approval should be skipped
        approval3 = db_session.query(ExpenseApproval).filter(
            ExpenseApproval.id == approvals[2].id
        ).first()
        assert approval3.status == ApprovalStatus.SKIPPED


class TestSpecificApproverRule:
    """Test specific approver auto-approval"""
    
    def test_specific_approver_auto_approve(self, db_session, test_company, test_users):
        """Test that specific approver can auto-approve"""
        # Create CFO rule
        rule = ApprovalRule(
            company_id=test_company.id,
            name="CFO Auto-Approve",
            rule_type=RuleType.SPECIFIC_APPROVER,
            specific_approver_id=test_users["admin"].id,
            min_amount=Decimal("0"),
            max_amount=Decimal("10000")
        )
        db_session.add(rule)
        db_session.flush()
        
        # Add multiple approvers including CFO
        for idx, user_key in enumerate(["manager1", "admin", "manager2"]):
            seq = ApproverSequence(
                approval_rule_id=rule.id,
                approver_id=test_users[user_key].id,
                sequence_order=idx + 1
            )
            db_session.add(seq)
        
        expense = Expense(
            company_id=test_company.id,
            employee_id=test_users["employee"].id,
            expense_number="EXP-TEST-003",
            title="High Value Expense",
            expense_date="2024-10-01",
            submitted_currency="USD",
            submitted_amount=Decimal("8000"),
            company_currency="USD",
            company_amount=Decimal("8000"),
            exchange_rate=Decimal("1"),
            status="pending"
        )
        db_session.add(expense)
        db_session.commit()
        
        approvals = ApprovalService.create_expense_approvals(db_session, expense, rule)
        
        # CFO approves (second in sequence)
        result = ApprovalService.process_approval_action(
            db_session,
            approvals[1],  # Admin/CFO approval
            "approve"
        )
        
        # Should auto-approve entire expense
        assert result["success"] == True
        assert result["expense_status"] == "approved"
        
        # Other approvals should be skipped
        db_session.refresh(approvals[0])
        db_session.refresh(approvals[2])
        assert approvals[0].status in [ApprovalStatus.PENDING, ApprovalStatus.SKIPPED]
        assert approvals[2].status == ApprovalStatus.SKIPPED


class TestHybridApproval:
    """Test hybrid approval rules"""
    
    def test_hybrid_percentage_or_specific(self, db_session, test_company, test_users):
        """Test hybrid rule: 60% OR CFO approval"""
        rule = ApprovalRule(
            company_id=test_company.id,
            name="Hybrid Rule",
            rule_type=RuleType.HYBRID,
            approval_percentage=Decimal("60.00"),
            specific_approver_id=test_users["admin"].id,
            min_amount=Decimal("0"),
            max_amount=Decimal("15000")
        )
        db_session.add(rule)
        db_session.flush()
        
        # Add 5 approvers
        approvers = [
            test_users["manager1"],
            test_users["manager2"],
            test_users["admin"],
            test_users["employee"],  # This would be another manager in reality
            test_users["employee"]   # This would be another manager in reality
        ]
        
        for idx, approver in enumerate(approvers[:3]):
            seq = ApproverSequence(
                approval_rule_id=rule.id,
                approver_id=approver.id,
                sequence_order=idx + 1
            )
            db_session.add(seq)
        
        expense = Expense(
            company_id=test_company.id,
            employee_id=test_users["employee"].id,
            expense_number="EXP-TEST-004",
            title="Large Expense",
            expense_date="2024-10-01",
            submitted_currency="USD",
            submitted_amount=Decimal("12000"),
            company_currency="USD",
            company_amount=Decimal("12000"),
            exchange_rate=Decimal("1"),
            status="pending"
        )
        db_session.add(expense)
        db_session.commit()
        
        approvals = ApprovalService.create_expense_approvals(db_session, expense, rule)
        
        # Admin approves - should auto-approve due to specific approver rule
        result = ApprovalService.process_approval_action(
            db_session,
            approvals[2],  # Admin
            "approve"
        )
        
        assert result["success"] == True
        assert result["expense_status"] == "approved"


class TestRejection:
    """Test expense rejection"""
    
    def test_rejection_stops_workflow(self, db_session, test_company, test_users):
        """Test that rejection stops the entire approval workflow"""
        rule = ApprovalRule(
            company_id=test_company.id,
            name="Sequential Rule",
            rule_type=RuleType.SEQUENTIAL,
            min_amount=Decimal("0"),
            max_amount=Decimal("1000")
        )
        db_session.add(rule)
        db_session.flush()
        
        for idx, user_key in enumerate(["manager1", "manager2"]):
            seq = ApproverSequence(
                approval_rule_id=rule.id,
                approver_id=test_users[user_key].id,
                sequence_order=idx + 1
            )
            db_session.add(seq)
        
        expense = Expense(
            company_id=test_company.id,
            employee_id=test_users["employee"].id,
            expense_number="EXP-TEST-005",
            title="Test Rejection",
            expense_date="2024-10-01",
            submitted_currency="USD",
            submitted_amount=Decimal("500"),
            company_currency="USD",
            company_amount=Decimal("500"),
            exchange_rate=Decimal("1"),
            status="pending"
        )
        db_session.add(expense)
        db_session.commit()
        
        approvals = ApprovalService.create_expense_approvals(db_session, expense, rule)
        
        # First approver rejects
        result = ApprovalService.process_approval_action(
            db_session,
            approvals[0],
            "reject",
            comments="Not a valid business expense"
        )
        
        assert result["success"] == True
        assert result["expense_status"] == "rejected"
        
        # Verify expense status
        db_session.refresh(expense)
        assert expense.status == "rejected"
        
        # Second approval should still be pending but expense is rejected
        db_session.refresh(approvals[1])
        assert approvals[1].status == ApprovalStatus.PENDING


# Run tests with: pytest app/tests/test_approval_logic.py -v