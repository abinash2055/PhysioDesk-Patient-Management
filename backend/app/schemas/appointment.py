from datetime import date, time
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    patient_id: int
    therapist_id: int
    appointment_date: date
    start_time: time

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    notes: str | None = None

    session_type: str | None = Field(
        default=None,
        max_length=100,
    )


class AppointmentUpdate(BaseModel):
    patient_id: int | None = None
    therapist_id: int | None = None
    appointment_date: date | None = None
    start_time: time | None = None

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    notes: str | None = None

    session_type: str | None = Field(
        default=None,
        max_length=100,
    )

    status: str | None = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    therapist_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    payment_method: str | None
    notes: str | None
    session_type: str | None

    model_config = {
        "from_attributes": True,
    }


class AvailableSlot(BaseModel):
    start_time: time
    end_time: time