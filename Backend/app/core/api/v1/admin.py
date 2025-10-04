# app/api/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, ManagerRelationship
from app.models.approval import ApprovalRule, ApproverSequence
from app.schemas.user import UserCreate, User as UserSchema, UserUpdate, UserWithManager
from app.schemas.approval import (
    ApprovalRuleCreate, ApprovalRule as ApprovalRuleSchema,
    ApprovalRuleWithSequences, ApprovalRuleUpdate
)
from app.core.security import get_password_hash
from app.services.approval_service import ApprovalService
from typing import List
from uuid import UUID

router = APIRouter()


@router.post("/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)"""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        company_id=current_user.company_id,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/users", response_model=List[UserWithManager])
def get_users(
    current_user: User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db)
):
    """Get all users in the company"""
    users = db.query(User).filter(
        User.company_id == current_user.company_id
    ).all()
    
    result = []
    for user in users:
        user_dict = UserWithManager.model_validate(user)
        
        # Get manager relationship
        manager_rel = db.query(ManagerRelationship).filter(
            ManagerRelationship.employee_id == user.id
        ).first()
        
        if manager_rel:
            manager = db.query(User).filter(User.id == manager_rel.manager_id).first()
            user_dict.manager_id = manager.id
            user_dict.manager_name = manager.full_name
        
        result.append(user_dict)
    
    return result


@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update user details"""
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/users/{employee_id}/manager/{manager_id}")
def assign_manager(
    employee_id: UUID,
    manager_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Assign manager to employee"""
    # Validate both users exist and are in same company
    employee = db.query(User).filter(
        User.id == employee_id,
        User.company_id == current_user.company_id
    ).first()
    
    manager = db.query(User).filter(
        User.id == manager_id,
        User.company_id == current_user.company_id
    ).first()
    
    if not employee or not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if manager.role not in ["manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user must be a manager or admin"
        )
    
    # Remove existing manager relationship
    db.query(ManagerRelationship).filter(
        ManagerRelationship.employee_id == employee_id
    ).delete()
    
    # Create new relationship
    relationship = ManagerRelationship(
        employee_id=employee_id,
        manager_id=manager_id
    )
    db.add(relationship)
    db.commit()
    
    return {"message": "Manager assigned successfully"}


@router.post("/approval-rules", response_model=ApprovalRuleSchema, status_code=status.HTTP_201_CREATED)
def create_approval_rule(
    rule_data: ApprovalRuleCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create approval rule"""
    rule = ApprovalService.create_approval_rule(
        db=db,
        company_id=current_user.company_id,
        rule_data=rule_data
    )
    
    return rule


@router.get("/approval-rules", response_model=List[ApprovalRuleWithSequences])
def get_approval_rules(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get all approval rules"""
    rules = db.query(ApprovalRule).filter(
        ApprovalRule.company_id == current_user.company_id
    ).order_by(ApprovalRule.priority.desc()).all()
    
    result = []
    for rule in rules:
        rule_dict = ApprovalRuleWithSequences.model_validate(rule)
        
        # Add approver names to sequences
        for seq in rule_dict.approver_sequences:
            approver = db.query(User).filter(User.id == seq.approver_id).first()
            if approver:
                seq.approver_name = approver.full_name
        
        result.append(rule_dict)
    
    return result


@router.put("/approval-rules/{rule_id}", response_model=ApprovalRuleSchema)
def update_approval_rule(
    rule_id: UUID,
    rule_data: ApprovalRuleUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update approval rule"""
    rule = db.query(ApprovalRule).filter(
        ApprovalRule.id == rule_id,
        ApprovalRule.company_id == current_user.company_id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval rule not found"
        )
    
    if rule_data.name is not None:
        rule.name = rule_data.name
    if rule_data.is_active is not None:
        rule.is_active = rule_data.is_active
    if rule_data.priority is not None:
        rule.priority = rule_data.priority
    
    db.commit()
    db.refresh(rule)
    
    return rule