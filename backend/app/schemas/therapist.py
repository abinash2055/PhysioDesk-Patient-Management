from datetime import date, time
from pydantic import BaseModel, Field


class TherapistCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    specialty: str = Field(
        min_length=2,
        max_length=150,
    )


class TherapistUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    specialty: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    is_active: bool | None = None


class TherapistResponse(BaseModel):
    id: int
    name: str
    specialty: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class ScheduleCreate(BaseModel):
    day_of_week: int = Field(
        ge=0,
        le=6,
    )

    start_time: time
    end_time: time

    slot_duration: int = Field(
        ge=5,
        le=240,
    )


class ScheduleResponse(BaseModel):
    id: int
    therapist_id: int
    day_of_week: int
    start_time: time
    end_time: time
    slot_duration: int

    model_config = {
        "from_attributes": True
    }


class ScheduleOverrideCreate(BaseModel):
    override_date: date
    is_day_off: bool = False
    start_time: time | None = None
    end_time: time | None = None
    slot_duration: int | None = Field(
        default=None,
        ge=5,
        le=240,
    )


class ScheduleOverrideResponse(BaseModel):
    id: int
    therapist_id: int
    override_date: date
    is_day_off: bool
    start_time: time | None
    end_time: time | None
    slot_duration: int | None

    model_config = {
        "from_attributes": True
    }