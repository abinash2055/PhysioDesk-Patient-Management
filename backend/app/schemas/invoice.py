from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InvoiceCreate(BaseModel):
    patient_id: int

    service: str = Field(
        min_length=1,
        max_length=150,
    )

    amount: Decimal = Field(
        ge=0,
        decimal_places=2,
    )

    discount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
    )

    status: str = Field(
        default="Due",
        max_length=30,
    )

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    invoice_date: date


class InvoiceUpdate(BaseModel):
    service: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    amount: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    discount: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    invoice_date: date | None = None


class InvoiceResponse(BaseModel):
    id: int
    patient_id: int
    service: str
    amount: Decimal
    discount: Decimal
    status: str
    payment_method: str | None
    invoice_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)