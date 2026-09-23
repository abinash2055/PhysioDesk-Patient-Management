from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PatientBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=3, max_length=30)
    age: int = Field(ge=0, le=120)
    gender: str = Field(min_length=1, max_length=30)
    address: str | None = None
    condition: str = Field(min_length=1, max_length=255)
    therapist_id: int | None = None
    package: str | None = Field(default=None, max_length=100)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        min_length=3,
        max_length=30,
    )

    age: int | None = Field(
        default=None,
        ge=0,
        le=120,
    )

    gender: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    address: str | None = None

    condition: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    therapist_id: int | None = None

    package: str | None = Field(
        default=None,
        max_length=100,
    )

    status: str | None = None


class PatientResponse(PatientBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )