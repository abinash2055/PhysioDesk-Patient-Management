from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def seed_users():
    db = SessionLocal()

    try:
        admin = db.execute(
            select(User).where(
                User.email == "admin@physiodesk.com"
            )
        ).scalar_one_or_none()

        if admin is None:
            admin = User(
                email="admin@physiodesk.com",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)

        staff = db.execute(
            select(User).where(
                User.email == "staff@physiodesk.com"
            )
        ).scalar_one_or_none()

        if staff is None:
            staff = User(
                email="staff@physiodesk.com",
                password_hash=hash_password("Staff@123"),
                role=UserRole.STAFF,
                is_active=True,
            )
            db.add(staff)

        db.commit()

        print("Users seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_users()