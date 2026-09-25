"""Database seeder for PhysioDesk.

Seeds deterministic, realistic sample data for every core table:

    * Users        -> 30  (keeps the documented admin@physiodesk.com /
                          staff@physiodesk.com credentials plus 28 staff)
    * Therapists   -> 30  (each with a Mon-Fri 08:00-18:00 weekly schedule)
    * Patients     -> 50  (assigned to therapists round-robin)
    * Invoices     -> 20 of EACH status (Due / Paid / Voided) = 60 total,
                      covering every invoice status type
    * Appointments -> one appointment for EVERY patient with EVERY therapist
                      = 50 * 30 = 1500 appointments, spread across non
                      overlapping 30-minute slots so that no two active
                      (Booked / Confirmed) appointments collide for a
                      therapist on the same day.

Run from the `backend` directory:

    python -m app.seed

The seeder is idempotent: it clears every seeded table (in FK-safe order) and
then reloads the data every run, so counts are always stable.

Interpretation note: "invoice of all type of each 20 data" is read as
"20 invoices of EACH status type", giving 60 invoices in total. Adjust the
`INVOICES_PER_STATUS` constant to change that behaviour.
"""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
import random

from sqlalchemy import delete, insert, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.appointment import Appointment
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.therapist import (
    Therapist,
    TherapistSchedule,
    TherapistScheduleOverride,
)
from app.models.user import User, UserRole

random.seed(42)

NUM_USERS = 30
NUM_THERAPISTS = 30
NUM_PATIENTS = 50
INVOICES_PER_STATUS = 20

INVOICE_STATUSES = ["Due", "Paid", "Voided"]
PATIENT_STATUSES = ["Active", "Active", "Active", "Inactive", "On hold", "Completed"]
PAYMENT_METHODS = ["Cash", "Card", "Online Transfer", "Cheque"]
SESSION_TYPES = ["Initial Assessment", "Follow-up", "Re-evaluation", "Maintenance"]
PACKAGE_TIERS = [
    "Single Session",
    "5 Sessions",
    "8 Sessions",
    "10 Sessions",
    "12 Sessions",
    "20 Sessions",
]
CONDITIONS = [
    "Lower back pain",
    "Knee pain",
    "Neck problem",
    "ENT problem",
    "Shoulder impingement",
    "Post-surgical rehab",
    "Sports injury",
    "Arthritis",
    "Sciatica",
    "Cervical spondylosis",
]
GENDERS = ["Male", "Female", "Other"]
SPECIALTIES = [
    "Orthopedic Physiotherapy",
    "Cardiology",
    "Neurology",
    "Sports Medicine",
    "Geriatric Physiotherapy",
    "Pediatric Physiotherapy",
    "Neurological Rehabilitation",
    "Musculoskeletal Therapy",
    "Post-natal Care",
    "Lymphatic Drainage",
]
FIRST_NAMES = [
    "Aarav", "Ajita", "Sita", "Ramesh", "Arjun", "Samjhana", "Bikram",
    "Pramila", "Kiran", "Meera", "Dipak", "Rupa", "Naresh", "Sarmila",
    "Ganesh", "Laxmi", "Ravi", "Kamala", "Sanjay", "Tara",
]
LAST_NAMES = [
    "Sharma", "Thapa", "Kunwar", "Dhungana", "Pandey", "Shrestha",
    "Bhandari", "Koirala", "Maharjan", "Gurung", "Magar", "Lama",
    "Rai", "Sherpa", "Basnet",
]
APPOINTMENT_NOTES = [
    "Patient reported improvement in mobility.",
    "Persistent stiffness noted; reassess next week.",
    "Pain levels reduced; continue current plan.",
    "No-show for follow-up; call to reschedule.",
    "First visit; baseline assessment completed.",
]
INVOICE_SERVICES = [
    "Physiotherapy Session",
    "ECG",
    "Ultrasound Therapy",
    "TENS Unit",
    "Manual Therapy",
    "Electrotherapy",
    "Dry Needling",
]


def _name_pool(size: int) -> list[str]:
    combos = [
        f"{first} {last}"
        for first in FIRST_NAMES
        for last in LAST_NAMES
    ]
    random.shuffle(combos)
    return combos[:size]


_NAME_POOL = _name_pool(NUM_THERAPISTS + NUM_PATIENTS)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def clear_database(db: Session) -> None:
    for model in (
        Appointment,
        Invoice,
        Patient,
        TherapistScheduleOverride,
        TherapistSchedule,
        Therapist,
        User,
    ):
        db.execute(delete(model))


def seed_users(db: Session) -> list[User]:
    users = [
        User(
            email="admin@physiodesk.com",
            password_hash=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        User(
            email="staff@physiodesk.com",
            password_hash=hash_password("Staff@123"),
            role=UserRole.STAFF,
            is_active=True,
            created_at=datetime.utcnow(),
        ),
    ]

    for i in range(NUM_USERS - 2):
        role = UserRole.ADMIN if i % 6 == 0 else UserRole.STAFF
        users.append(
            User(
                email=f"staff{i + 1}@physiodesk.com",
                password_hash=hash_password(f"StaffPass{i + 1}!"),
                role=role,
                is_active=True,
                created_at=datetime.utcnow(),
            )
        )

    db.add_all(users)
    db.flush()
    return users


def seed_therapists(db: Session) -> list[Therapist]:
    therapists = [
        Therapist(
            name=_NAME_POOL[i],
            specialty=SPECIALTIES[i % len(SPECIALTIES)],
            is_active=True,
        )
        for i in range(NUM_THERAPISTS)
    ]
    db.add_all(therapists)
    db.flush()
    return therapists


def seed_schedules(db: Session, therapists: list[Therapist]) -> None:
    rows = []
    for therapist in therapists:
        for day_of_week in range(5):  # Mon(0) - Fri(4)
            rows.append(
                {
                    "therapist_id": therapist.id,
                    "day_of_week": day_of_week,
                    "start_time": time(8, 0),
                    "end_time": time(18, 0),
                    "slot_duration": 30,
                }
            )
    db.execute(insert(TherapistSchedule), rows)
    db.flush()


def seed_schedule_overrides(
    db: Session, therapists: list[Therapist]
) -> None:
    today = date.today()
    # Place overrides well outside the seeded appointment window so the
    # appointment data stays consistent with availability lookups.
    far = today + timedelta(days=20)
    rows = [
        {
            "therapist_id": therapists[0].id,
            "override_date": far + timedelta(days=1),
            "is_day_off": True,
            "start_time": None,
            "end_time": None,
            "slot_duration": None,
        },
        {
            "therapist_id": therapists[1].id,
            "override_date": far + timedelta(days=2),
            "is_day_off": False,
            "start_time": time(10, 0),
            "end_time": time(14, 0),
            "slot_duration": 60,
        },
    ]
    db.execute(insert(TherapistScheduleOverride), rows)
    db.flush()


def seed_patients(
    db: Session, therapists: list[Therapist]
) -> list[Patient]:
    patients = []
    for i in range(NUM_PATIENTS):
        patients.append(
            Patient(
                name=_NAME_POOL[NUM_THERAPISTS + i],
                phone=f"98{(100000000 + i):08d}",
                age=18 + (i * 37 % 60),
                gender=GENDERS[i % len(GENDERS)],
                address=f"Patient Address {i + 1}",
                condition=CONDITIONS[i % len(CONDITIONS)],
                therapist_id=therapists[i % NUM_THERAPISTS].id,
                package=PACKAGE_TIERS[(i * 7) % len(PACKAGE_TIERS)],
                status=PATIENT_STATUSES[i % len(PATIENT_STATUSES)],
                created_at=now_utc(),
                updated_at=now_utc(),
            )
        )
    db.add_all(patients)
    db.flush()
    return patients


def seed_invoices(
    db: Session, patients: list[Patient]
) -> int:
    rows: list[dict] = []
    today = date.today()
    count = 0
    for status in INVOICE_STATUSES:
        for k in range(INVOICES_PER_STATUS):
            amount_val = round(500 + (k * 37 + count) % 2500, 2)
            discount_val = round(min((count * 53 % int(amount_val)), amount_val), 2)
            rows.append(
                {
                    "patient_id": patients[count % NUM_PATIENTS].id,
                    "service": INVOICE_SERVICES[(count * 3) % len(INVOICE_SERVICES)],
                    "amount": Decimal(f"{amount_val:.2f}"),
                    "discount": Decimal(f"{discount_val:.2f}"),
                    "status": status,
                    "payment_method": (
                        None
                        if status == "Voided"
                        else PAYMENT_METHODS[k % len(PAYMENT_METHODS)]
                    ),
                    "invoice_date": today - timedelta(days=count % 20),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            )
            count += 1
    db.execute(insert(Invoice), rows)
    db.flush()
    return count


def _weekday_window(today: date, total: int = 10) -> list[date]:
    dates = sorted(
        {
            today + timedelta(days=k)
            for k in range(-14, 15)
            if (today + timedelta(days=k)).weekday() < 5
        }
    )
    ref = today if today.weekday() < 5 else today - timedelta(days=1)
    idx = dates.index(ref) if ref in dates else len(dates) // 2
    start = idx - total // 2
    start = max(0, min(start, len(dates) - total))
    return dates[start : start + total]


def _build_canonical_slots(today: date) -> list[tuple[date, time, time]]:
    """50 non-overlapping 30-minute slots on Mon-Fri within working hours.

    The same 50 slots are shared by every therapist; each therapist is
    assigned a distinct permutation of these slots (one per patient) so no
    two active appointments for a single therapist can ever overlap.
    """
    window = _weekday_window(today, total=10)
    start_minutes = 8 * 60
    slots: list[tuple[date, time, time]] = []
    for day in window:
        for s in range(5):
            sm = start_minutes + s * 30
            em = sm + 30
            slots.append((day, time(sm // 60, sm % 60), time(em // 60, em % 60)))
    return slots


def _appointment_status(
    slot_date: date, today: date, key: int
) -> str:
    if slot_date < today:
        return "Cancelled" if key % 5 == 0 else "Completed"
    if slot_date == today:
        return "Completed" if key % 2 == 0 else "Booked"
    return "Confirmed" if key % 4 == 0 else "Booked"


def seed_appointments(
    db: Session,
    patients: list[Patient],
    therapists: list[Therapist],
) -> int:
    today = date.today()
    slots = _build_canonical_slots(today)
    rows: list[dict] = []

    for i in range(NUM_PATIENTS):
        patient = patients[i]
        for j in range(NUM_THERAPISTS):
            therapist = therapists[j]
            slot_no = (i + j) % len(slots)
            appt_date, start_time, end_time = slots[slot_no]
            key = i + j
            rows.append(
                {
                    "patient_id": patient.id,
                    "therapist_id": therapist.id,
                    "appointment_date": appt_date,
                    "start_time": start_time,
                    "end_time": end_time,
                    "status": _appointment_status(appt_date, today, key),
                    "payment_method": PAYMENT_METHODS[key % len(PAYMENT_METHODS)],
                    "notes": APPOINTMENT_NOTES[key % len(APPOINTMENT_NOTES)],
                    "session_type": SESSION_TYPES[key % len(SESSION_TYPES)],
                    "created_at": now_utc(),
                }
            )
    db.execute(insert(Appointment), rows)
    db.flush()
    return len(rows)


def seed_all(db: Session | None = None) -> dict:
    own_db = db is None
    db = db or SessionLocal()
    try:
        clear_database(db)
        db.commit()

        users = seed_users(db)
        db.commit()

        therapists = seed_therapists(db)
        seed_schedules(db, therapists)
        seed_schedule_overrides(db, therapists)
        patients = seed_patients(db, therapists)

        invoice_count = seed_invoices(db, patients)
        appointment_count = seed_appointments(db, patients, therapists)

        db.commit()

        return {
            "users": len(users),
            "therapists": len(therapists),
            "patients": len(patients),
            "invoices": invoice_count,
            "appointments": appointment_count,
        }
    except Exception:
        db.rollback()
        raise
    finally:
        if own_db:
            db.close()


if __name__ == "__main__":
    summary = seed_all()
    print("Seeding complete:")
    for name, count in summary.items():
        print(f"  {name}: {count}")
