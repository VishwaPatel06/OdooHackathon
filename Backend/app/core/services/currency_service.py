# app/services/currency_service.py
import httpx
from typing import Dict, Optional
from app.core.config import settings
from decimal import Decimal


class CurrencyService:
    @staticmethod
    async def get_exchange_rate(from_currency: str, to_currency: str) -> Optional[Decimal]:
        """Get exchange rate between two currencies"""
        if from_currency == to_currency:
            return Decimal("1.0")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.CURRENCY_API_BASE}/{from_currency}",
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                if to_currency in data.get("rates", {}):
                    return Decimal(str(data["rates"][to_currency]))
                
                return None
        except Exception as e:
            print(f"Error fetching exchange rate: {e}")
            return None
    
    @staticmethod
    async def convert_amount(amount: Decimal, from_currency: str, to_currency: str) -> Optional[Decimal]:
        """Convert amount from one currency to another"""
        rate = await CurrencyService.get_exchange_rate(from_currency, to_currency)
        if rate is None:
            return None
        
        return (amount * rate).quantize(Decimal("0.01"))
    
    @staticmethod
    async def get_countries_with_currencies() -> list:
        """Get list of countries with their currencies"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.COUNTRIES_API}?fields=name,currencies",
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error fetching countries: {e}")
            return []

