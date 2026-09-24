from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    AvailableSlot,
)
from app.services.appointment_service import (
    get_patient_or_404,
    get_therapist_or_404,
    get_working_hours,
    validate_slot,
)

router = APIRouter(
    prefix="/api/appointments",
    tags=["Appointments"],
)


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_patient_or_404(
        appointment_data.patient_id,
        db,
    )

    get_therapist_or_404(
        appointment_data.therapist_id,
        db,
    )

    end_time = validate_slot(
        therapist_id=appointment_data.therapist_id,
        appointment_date=appointment_data.appointment_date,
        start_time=appointment_data.start_time,
        db=db,
    )

    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        therapist_id=appointment_data.therapist_id,
        appointment_date=appointment_data.appointment_date,
        start_time=appointment_data.start_time,
        end_time=end_time,
        status="Booked",
        payment_method=appointment_data.payment_method,
        notes=appointment_data.notes,
        session_type=appointment_data.session_type,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


@router.get(
    "",
    response_model=list[AppointmentResponse],
)
def list_appointments(
    appointment_date: date | None = Query(default=None),
    therapist_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    appointment_status: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Appointment)

    if appointment_date is not None:
        query = query.where(
            Appointment.appointment_date
            == appointment_date
        )

    if therapist_id is not None:
        query = query.where(
            Appointment.therapist_id
            == therapist_id
        )

    if patient_id is not None:
        query = query.where(
            Appointment.patient_id
            == patient_id
        )

    if appointment_status is not None:
        query = query.where(
            Appointment.status
            == appointment_status
        )

    query = query.order_by(
        Appointment.appointment_date,
        Appointment.start_time,
    )

    result = db.execute(query)

    return result.scalars().all()


@router.get(
    "/available-slots",
    response_model=list[AvailableSlot],
)
def get_available_slots(
    therapist_id: int,
    appointment_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_therapist_or_404(
        therapist_id,
        db,
    )

    working_hours = get_working_hours(
        therapist_id,
        appointment_date,
        db,
    )

    if working_hours is None:
        return []

    slot_duration = working_hours["slot_duration"]

    from datetime import datetime, timedelta

    current = datetime.combine(
        appointment_date,
        working_hours["start_time"],
    )

    end_of_day = datetime.combine(
        appointment_date,
        working_hours["end_time"],
    )

    slots = []

    while current + timedelta(
        minutes=slot_duration
    ) <= end_of_day:

        slot_start = current.time()

        slot_end = (
            current + timedelta(
                minutes=slot_duration
            )
        ).time()

        from app.services.appointment_service import (
            has_conflict,
        )

        if not has_conflict(
            therapist_id,
            appointment_date,
            slot_start,
            slot_end,
            db,
        ):
            slots.append(
                AvailableSlot(
                    start_time=slot_start,
                    end_time=slot_end,
                )
            )

        current += timedelta(
            minutes=slot_duration
        )

    return slots


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    return appointment


@router.put(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    if appointment.status in {
        "Cancelled",
        "Completed",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled appointment",
        )

    new_patient_id = (
        appointment_data.patient_id
        if appointment_data.patient_id is not None
        else appointment.patient_id
    )

    new_therapist_id = (
        appointment_data.therapist_id
        if appointment_data.therapist_id is not None
        else appointment.therapist_id
    )

    new_date = (
        appointment_data.appointment_date
        if appointment_data.appointment_date is not None
        else appointment.appointment_date
    )

    new_start_time = (
        appointment_data.start_time
        if appointment_data.start_time is not None
        else appointment.start_time
    )

    get_patient_or_404(
        new_patient_id,
        db,
    )

    get_therapist_or_404(
        new_therapist_id,
        db,
    )

    end_time = validate_slot(
        therapist_id=new_therapist_id,
        appointment_date=new_date,
        start_time=new_start_time,
        db=db,
        exclude_appointment_id=appointment.id,
    )

    appointment.patient_id = new_patient_id
    appointment.therapist_id = new_therapist_id
    appointment.appointment_date = new_date
    appointment.start_time = new_start_time
    appointment.end_time = end_time

    update_data = appointment_data.model_dump(
        exclude_unset=True,
    )

    if "payment_method" in update_data:
        appointment.payment_method = (
            update_data["payment_method"]
        )

    if "notes" in update_data:
        appointment.notes = update_data["notes"]

    if "session_type" in update_data:
        appointment.session_type = (
            update_data["session_type"]
        )

    db.commit()
    db.refresh(appointment)

    return appointment


@router.patch(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    if appointment.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed appointment cannot be cancelled",
        )

    appointment.status = "Cancelled"

    db.commit()
    db.refresh(appointment)

    return appointment


@router.patch(
    "/{appointment_id}/complete",
    response_model=AppointmentResponse,
)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    if appointment.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled appointment cannot be completed",
        )

    appointment.status = "Completed"

    db.commit()
    db.refresh(appointment)

    return appointment


