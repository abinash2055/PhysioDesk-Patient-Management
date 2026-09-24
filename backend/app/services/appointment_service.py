from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.therapist import (
    Therapist,
    TherapistSchedule,
    TherapistScheduleOverride,
)


ACTIVE_APPOINTMENT_STATUSES = {
    "Booked",
    "Confirmed",
}


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

    if patient.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule an inactive patient",
        )

    return patient


def get_therapist_or_404(
    therapist_id: int,
    db: Session,
) -> Therapist:

    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    if not therapist.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule an inactive therapist",
        )

    return therapist


def get_working_hours(
    therapist_id: int,
    appointment_date: date,
    db: Session,
):
    override = db.execute(
        select(TherapistScheduleOverride).where(
            TherapistScheduleOverride.therapist_id
            == therapist_id,
            TherapistScheduleOverride.override_date
            == appointment_date,
        )
    ).scalar_one_or_none()

    if override:
        if override.is_day_off:
            return None

        return {
            "start_time": override.start_time,
            "end_time": override.end_time,
            "slot_duration": override.slot_duration or 30,
        }

    day_of_week = appointment_date.weekday()

    schedule = db.execute(
        select(TherapistSchedule).where(
            TherapistSchedule.therapist_id
            == therapist_id,
            TherapistSchedule.day_of_week
            == day_of_week,
        )
    ).scalar_one_or_none()

    if schedule is None:
        return None

    return {
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "slot_duration": schedule.slot_duration,
    }


def has_conflict(
    therapist_id: int,
    appointment_date: date,
    start_time: time,
    end_time: time,
    db: Session,
    exclude_appointment_id: int | None = None,
) -> bool:

    query = select(Appointment).where(
        Appointment.therapist_id == therapist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    )

    if exclude_appointment_id is not None:
        query = query.where(
            Appointment.id != exclude_appointment_id
        )

    existing = db.execute(query).scalar_one_or_none()

    return existing is not None


def validate_slot(
    therapist_id: int,
    appointment_date: date,
    start_time: time,
    db: Session,
    exclude_appointment_id: int | None = None,
):
    working_hours = get_working_hours(
        therapist_id,
        appointment_date,
        db,
    )

    if working_hours is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Therapist is not available on this date",
        )

    slot_duration = working_hours["slot_duration"]

    start_datetime = datetime.combine(
        appointment_date,
        start_time,
    )

    end_datetime = start_datetime + timedelta(
        minutes=slot_duration
    )

    end_time = end_datetime.time()

    if start_time < working_hours["start_time"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Appointment starts before "
                "therapist availability"
            ),
        )

    if end_time > working_hours["end_time"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Appointment ends after "
                "therapist availability"
            ),
        )

    if has_conflict(
        therapist_id,
        appointment_date,
        start_time,
        end_time,
        db,
        exclude_appointment_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Therapist already has an appointment "
                "during this time"
            ),
        )

    return end_time