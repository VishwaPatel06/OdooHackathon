# app/schemas/company.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    country: str = Field(..., min_length=2, max_length=100)
    currency_code: str = Field(..., min_length=3, max_length=3)


class CompanyCreate(CompanyBase):
    pass


class Company(CompanyBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
