from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.therapist import (
    Therapist,
    TherapistSchedule,
    TherapistScheduleOverride,
)
from app.models.user import User
from app.schemas.therapist import (
    ScheduleCreate,
    ScheduleOverrideCreate,
    ScheduleOverrideResponse,
    ScheduleResponse,
    TherapistCreate,
    TherapistResponse,
    TherapistUpdate,
)

router = APIRouter(
    prefix="/api/therapists",
    tags=["Therapists"],
)


@router.get(
    "",
    response_model=list[TherapistResponse],
)
def list_therapists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.execute(
        select(Therapist)
        .order_by(Therapist.name)
    )

    return result.scalars().all()


@router.get(
    "/{therapist_id}",
    response_model=TherapistResponse,
)
def get_therapist(
    therapist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    return therapist


@router.post(
    "",
    response_model=TherapistResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_therapist(
    therapist_data: TherapistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    therapist = Therapist(
        name=therapist_data.name,
        specialty=therapist_data.specialty,
        is_active=True,
    )

    db.add(therapist)
    db.commit()
    db.refresh(therapist)

    return therapist


@router.put(
    "/{therapist_id}",
    response_model=TherapistResponse,
)
def update_therapist(
    therapist_id: int,
    therapist_data: TherapistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    update_data = therapist_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(therapist, field, value)

    db.commit()
    db.refresh(therapist)

    return therapist


@router.patch(
    "/{therapist_id}/deactivate",
    response_model=TherapistResponse,
)
def deactivate_therapist(
    therapist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    therapist.is_active = False

    db.commit()
    db.refresh(therapist)

    return therapist


@router.post(
    "/{therapist_id}/schedule",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_schedule(
    therapist_id: int,
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    if schedule_data.end_time <= schedule_data.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )

    existing = db.execute(
        select(TherapistSchedule).where(
            TherapistSchedule.therapist_id == therapist_id,
            TherapistSchedule.day_of_week
            == schedule_data.day_of_week,
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Schedule already exists for this day",
        )

    schedule = TherapistSchedule(
        therapist_id=therapist_id,
        day_of_week=schedule_data.day_of_week,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        slot_duration=schedule_data.slot_duration,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


@router.get(
    "/{therapist_id}/schedule",
    response_model=list[ScheduleResponse],
)
def get_schedule(
    therapist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    result = db.execute(
        select(TherapistSchedule)
        .where(
            TherapistSchedule.therapist_id
            == therapist_id
        )
        .order_by(
            TherapistSchedule.day_of_week
        )
    )

    return result.scalars().all()


@router.post(
    "/{therapist_id}/schedule-overrides",
    response_model=ScheduleOverrideResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_schedule_override(
    therapist_id: int,
    override_data: ScheduleOverrideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    if not override_data.is_day_off:
        if (
            override_data.start_time is None
            or override_data.end_time is None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Start and end time are required "
                    "for a working-day override"
                ),
            )

        if (
            override_data.end_time
            <= override_data.start_time
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time",
            )

    existing = db.execute(
        select(TherapistScheduleOverride).where(
            TherapistScheduleOverride.therapist_id
            == therapist_id,
            TherapistScheduleOverride.override_date
            == override_data.override_date,
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Override already exists for this date",
        )

    override = TherapistScheduleOverride(
        therapist_id=therapist_id,
        override_date=override_data.override_date,
        is_day_off=override_data.is_day_off,
        start_time=override_data.start_time,
        end_time=override_data.end_time,
        slot_duration=override_data.slot_duration,
    )

    db.add(override)
    db.commit()
    db.refresh(override)

    return override


@router.get(
    "/{therapist_id}/schedule-overrides",
    response_model=list[ScheduleOverrideResponse],
)
def get_schedule_overrides(
    therapist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    therapist = db.get(
        Therapist,
        therapist_id,
    )

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    result = db.execute(
        select(TherapistScheduleOverride)
        .where(
            TherapistScheduleOverride.therapist_id
            == therapist_id
        )
        .order_by(
            TherapistScheduleOverride.override_date
        )
    )

    return result.scalars().all()

