from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.invoice import Invoice
from app.models.user import User
from app.models.patient import Patient
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
)


router = APIRouter(
    prefix="/api/invoices",
    tags=["Billing"],
)


def get_patient_or_404(
    patient_id: int,
    db: Session,
) -> Patient:
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return patient


def validate_invoice_amounts(
    amount: Decimal,
    discount: Decimal,
):
    if discount > amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be greater than invoice amount",
        )


@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    patient = get_patient_or_404(
        invoice_data.patient_id,
        db,
    )

    validate_invoice_amounts(
        invoice_data.amount,
        invoice_data.discount,
    )

    if invoice_data.status not in {
        "Due",
        "Paid",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice status must be Due or Paid",
        )

    invoice = Invoice(
        patient_id=patient.id,
        service=invoice_data.service,
        amount=invoice_data.amount,
        discount=invoice_data.discount,
        status=invoice_data.status,
        payment_method=invoice_data.payment_method,
        invoice_date=invoice_data.invoice_date,
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return invoice


@router.get(
    "",
    response_model=list[InvoiceResponse],
)
def list_invoices(
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    patient_id: int | None = None,
    invoice_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Invoice)

    if status_filter:
        if status_filter not in {
            "Due",
            "Paid",
            "Voided",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invoice status",
            )

        query = query.where(
            Invoice.status == status_filter
        )

    if patient_id is not None:
        query = query.where(
            Invoice.patient_id == patient_id
        )

    if invoice_date is not None:
        query = query.where(
            Invoice.invoice_date == invoice_date
        )

    query = query.order_by(
        Invoice.invoice_date.desc(),
        Invoice.id.desc(),
    )

    result = db.execute(query)

    return result.scalars().all()


@router.get(
    "/patient/{patient_id}",
    response_model=list[InvoiceResponse],
)
def get_patient_billing_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_patient_or_404(
        patient_id,
        db,
    )

    result = db.execute(
        select(Invoice)
        .where(Invoice.patient_id == patient_id)
        .order_by(
            Invoice.invoice_date.desc(),
            Invoice.id.desc(),
        )
    )

    return result.scalars().all()


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invoice = db.get(
        Invoice,
        invoice_id,
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invoice = db.get(
        Invoice,
        invoice_id,
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    if invoice.status == "Voided":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voided invoices cannot be edited",
        )

    new_amount = (
        invoice_data.amount
        if invoice_data.amount is not None
        else invoice.amount
    )

    new_discount = (
        invoice_data.discount
        if invoice_data.discount is not None
        else invoice.discount
    )

    validate_invoice_amounts(
        new_amount,
        new_discount,
    )

    update_data = invoice_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            invoice,
            field,
            value,
        )

    db.commit()
    db.refresh(invoice)

    return invoice


@router.patch(
    "/{invoice_id}/pay",
    response_model=InvoiceResponse,
)
def mark_invoice_paid(
    invoice_id: int,
    payment_method: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invoice = db.get(
        Invoice,
        invoice_id,
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    if invoice.status == "Voided":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voided invoice cannot be marked as paid",
        )

    if invoice.status == "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already paid",
        )

    invoice.status = "Paid"

    if payment_method:
        invoice.payment_method = payment_method

    db.commit()
    db.refresh(invoice)

    return invoice


@router.patch(
    "/{invoice_id}/void",
    response_model=InvoiceResponse,
)
def void_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=400,
            detail="Invoice not found."
        )

    if invoice.status == "Voided":
        raise HTTPException(
            status_code=400,
            detail="Invoice is already voided."
        )

    invoice.status = "Voided"

    db.commit()
    db.refresh(invoice)

    return invoice
