# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=255)
    company_name: str = Field(..., min_length=2, max_length=255)
    country: str = Field(..., min_length=2, max_length=100)
    currency_code: str = Field(..., min_length=3, max_length=3)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "User"
    company: "Company"


# Forward references
from app.schemas.user import User
from app.schemas.company import Company
ExpenseWithDetails.model_rebuild()
TokenResponse.model_rebuild()