# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.company import Company
from app.models.user import User
from app.models.expense import ExpenseCategory
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.user import UserRole
from datetime import timedelta
from app.core.config import settings

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
def signup(signup_data: SignupRequest, db: Session = Depends(get_db)):
    """Sign up new user and create company"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == signup_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create company
    company = Company(
        name=signup_data.company_name,
        country=signup_data.country,
        currency_code=signup_data.currency_code
    )
    db.add(company)
    db.flush()
    
    # Create admin user
    user = User(
        company_id=company.id,
        email=signup_data.email,
        password_hash=get_password_hash(signup_data.password),
        full_name=signup_data.full_name,
        role=UserRole.ADMIN
    )
    db.add(user)
    db.flush()
    
    # Create default expense categories
    default_categories = [
        "Travel & Transportation",
        "Meals & Entertainment",
        "Office Supplies",
        "Software & Subscriptions",
        "Training & Education",
        "Client Entertainment",
        "Marketing & Advertising",
        "Utilities",
        "Other"
    ]
    
    for cat_name in default_categories:
        category = ExpenseCategory(
            company_id=company.id,
            name=cat_name,
            description=f"Default category: {cat_name}"
        )
        db.add(category)
    
    db.commit()
    db.refresh(user)
    db.refresh(company)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "company_id": str(company.id)}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user,
        company=company
    )


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    company = db.query(Company).filter(Company.id == user.company_id).first()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "company_id": str(company.id)}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user,
        company=company
    )

