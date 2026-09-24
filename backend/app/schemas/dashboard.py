from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    patients_seen_today: int
    therapists_on_duty_today: int
    revenue_collected_today: Decimal
    open_slots_today: int


class TherapistCapacity(BaseModel):
    therapist_id: int
    therapist_name: str
    specialty: str
    total_slots: int
    booked_slots: int
    open_slots: int


class RecentPatient(BaseModel):
    id: int
    name: str
    phone: str
    condition: str
    status: str
    therapist_id: int | None
    created_at: date | None = None


class DashboardResponse(BaseModel):
    date: date
    stats: DashboardStats
    therapist_capacity: list[TherapistCapacity]
    recent_patients: list[RecentPatient]
