from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.therapist import (
    Therapist,
    TherapistSchedule,
    TherapistScheduleOverride,
)
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    RecentPatient,
    TherapistCapacity,
)


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


ACTIVE_APPOINTMENT_STATUSES = {
    "Booked",
    "Confirmed",
}


def get_working_hours(
    therapist_id: int,
    target_date: date,
    db: Session,
):
    """
    Determine the therapist's working hours for a specific date.

    Date-specific override takes priority over weekly schedule.
    """

    override = db.execute(
        select(TherapistScheduleOverride)
        .where(
            TherapistScheduleOverride.therapist_id == therapist_id,
            TherapistScheduleOverride.override_date == target_date,
        )
    ).scalar_one_or_none()

    if override:
        if override.is_day_off:
            return None

        if (
            override.start_time is None
            or override.end_time is None
        ):
            return None

        return {
            "start_time": override.start_time,
            "end_time": override.end_time,
            "slot_duration": (
                override.slot_duration
                or 30
            ),
        }

    schedule = db.execute(
        select(TherapistSchedule)
        .where(
            TherapistSchedule.therapist_id == therapist_id,
            TherapistSchedule.day_of_week
            == target_date.weekday(),
        )
    ).scalar_one_or_none()

    if schedule is None:
        return None

    return {
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "slot_duration": schedule.slot_duration,
    }


def count_total_slots(
    start_time: time,
    end_time: time,
    slot_duration: int,
) -> int:
    start = datetime.combine(
        date.today(),
        start_time,
    )

    end = datetime.combine(
        date.today(),
        end_time,
    )

    total_minutes = int(
        (end - start).total_seconds() / 60
    )

    if total_minutes <= 0:
        return 0

    return total_minutes // slot_duration


def count_booked_slots(
    therapist_id: int,
    target_date: date,
    db: Session,
) -> int:
    result = db.execute(
        select(func.count(Appointment.id))
        .where(
            Appointment.therapist_id == therapist_id,
            Appointment.appointment_date == target_date,
            Appointment.status.in_(
                ACTIVE_APPOINTMENT_STATUSES
            ),
        )
    )

    return result.scalar_one()


@router.get(
    "",
    response_model=DashboardResponse,
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()

    patients_seen_result = db.execute(
        select(
            func.count(
                func.distinct(
                    Appointment.patient_id
                )
            )
        )
        .where(
            Appointment.appointment_date == today,
            Appointment.status == "Completed",
        )
    )

    patients_seen_today = patients_seen_result.scalar_one()

    therapists_result = db.execute(
        select(Therapist)
        .where(Therapist.is_active.is_(True))
        .order_by(Therapist.name)
    )

    therapists = therapists_result.scalars().all()

    therapist_capacity = []

    therapists_on_duty_today = 0
    total_open_slots_today = 0

    for therapist in therapists:
        working_hours = get_working_hours(
            therapist.id,
            today,
            db,
        )

        if working_hours is None:
            continue

        therapists_on_duty_today += 1

        total_slots = count_total_slots(
            working_hours["start_time"],
            working_hours["end_time"],
            working_hours["slot_duration"],
        )

        booked_slots = count_booked_slots(
            therapist.id,
            today,
            db,
        )

        open_slots = max(
            total_slots - booked_slots,
            0,
        )

        total_open_slots_today += open_slots

        therapist_capacity.append(
            TherapistCapacity(
                therapist_id=therapist.id,
                therapist_name=therapist.name,
                specialty=therapist.specialty,
                total_slots=total_slots,
                booked_slots=booked_slots,
                open_slots=open_slots,
            )
        )

    revenue_result = db.execute(
        select(
            func.coalesce(
                func.sum(
                    Invoice.amount - Invoice.discount
                ),
                0,
            )
        )
        .where(
            Invoice.invoice_date == today,
            Invoice.status == "Paid",
        )
    )

    revenue_collected_today = revenue_result.scalar_one()

    recent_patients_result = db.execute(
        select(Patient)
        .order_by(
            Patient.created_at.desc()
        )
        .limit(5)
    )

    recent_patients = [
        RecentPatient(
            id=patient.id,
            name=patient.name,
            phone=patient.phone,
            condition=patient.condition,
            status=patient.status,
            therapist_id=patient.therapist_id,
            created_at=(
                patient.created_at.date()
                if patient.created_at
                else None
            ),
        )
        for patient in recent_patients_result.scalars().all()
    ]

    return DashboardResponse(
        date=today,
        stats=DashboardStats(
            patients_seen_today=patients_seen_today,
            therapists_on_duty_today=therapists_on_duty_today,
            revenue_collected_today=revenue_collected_today,
            open_slots_today=total_open_slots_today,
        ),
        therapist_capacity=therapist_capacity,
        recent_patients=recent_patients,
    )