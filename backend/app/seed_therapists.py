from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.therapist import Therapist, TherapistSchedule


def seed_therapists_and_schedules():
    db = SessionLocal()

    try:
        therapists_data = [
            {
                "name": "Dr. Rohan Thakur",
                "specialty": "Orthopedic Physiotherapy",
                "is_active": True,
                "schedules": [
                    {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Monday
                    {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Tuesday
                    {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Wednesday
                    {"day_of_week": 5, "start_time": "09:00", "end_time": "13:00", "slot_duration": 30},  # Saturday
                ],
            },
            {
                "name": "Dr. Maya Sharma",
                "specialty": "Sports Rehabilitation",
                "is_active": True,
                "schedules": [
                    {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Monday
                    {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Tuesday
                    {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Wednesday
                    {"day_of_week": 5, "start_time": "09:00", "end_time": "13:00", "slot_duration": 30},  # Saturday
                ],
            },
            {
                "name": "Dr. Arjun Patel",
                "specialty": "Neurological Physiotherapy",
                "is_active": True,
                "schedules": [
                    {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Monday
                    {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Tuesday
                    {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Wednesday
                    {"day_of_week": 5, "start_time": "09:00", "end_time": "13:00", "slot_duration": 30},  # Saturday
                ],
            },
            {
                "name": "Dr. Priya Nair",
                "specialty": "Pediatric Physiotherapy",
                "is_active": True,
                "schedules": [
                    {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Monday
                    {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Tuesday
                    {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "slot_duration": 30},  # Wednesday
                    {"day_of_week": 5, "start_time": "09:00", "end_time": "13:00", "slot_duration": 30},  # Saturday
                ],
            },
        ]

        for therapist_data in therapists_data:
            schedules_data = therapist_data.pop("schedules")

            existing = db.execute(
                select(Therapist).where(Therapist.name == therapist_data["name"])
            ).scalar_one_or_none()

            if existing is None:
                therapist = Therapist(**therapist_data)
                db.add(therapist)
                db.flush()

                for schedule_data in schedules_data:
                    existing_schedule = db.execute(
                        select(TherapistSchedule).where(
                            TherapistSchedule.therapist_id == therapist.id,
                            TherapistSchedule.day_of_week == schedule_data["day_of_week"],
                        )
                    ).scalar_one_or_none()

                    if existing_schedule is None:
                        schedule = TherapistSchedule(
                            therapist_id=therapist.id,
                            **schedule_data
                        )
                        db.add(schedule)

                print(f"Created therapist: {therapist_data['name']} with schedules")
            else:
                print(f"Therapist already exists: {therapist_data['name']}")

        db.commit()
        print("Therapists and schedules seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_therapists_and_schedules()