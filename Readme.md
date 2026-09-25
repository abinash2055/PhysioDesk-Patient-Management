# PhysioDesk

A full-stack clinic management application for physiotherapy practices.

PhysioDesk provides authentication, patient management, therapist scheduling, appointment booking, billing, and dashboard reporting through a FastAPI backend, PostgreSQL database, and Next.js frontend.
---

## Features

### Authentication & Authorization

- JWT-based authentication
- Secure password hashing using Argon2
- Admin and Staff roles
- Protected API routes
- Role-based backend authorization
- Frontend authentication handling
- Admin-only therapist management
- Staff users cannot perform Admin-only therapist management actions

### Dashboard

- Patients seen today
- Therapists on duty
- Revenue collected today
- Open/available appointment slots
- Therapist capacity
- Daily appointment overview
- Recent patients

Dashboard values are calculated from live database data rather than hardcoded values.

### Patients

- Create patients
- View patient list
- Search by name or phone
- Filter by therapist
- Filter by status
- Edit patient information
- Deactivate patients
- Patient profile view
- Session history
- Billing history

### Scheduling

- Therapist-based calendar/grid
- Selectable appointment dates
- Therapist working schedules
- Date-specific schedule overrides
- Day-off support
- Appointment booking
- Appointment rescheduling
- Appointment cancellation
- Appointment completion
- Appointment status
- Payment method
- Session type
- Notes
- Therapist availability validation
- Double-booking prevention

### Billing

- Create invoices
- View invoices
- Filter invoices by status
- Patient billing history
- Discounts
- Paid/Due status
- Payment method
- Mark Due invoices as Paid
- Void/delete invoices

### Therapists

- Therapist roster
- Specialty
- Active/inactive status
- Weekly working schedules
- Start/end time
- Slot duration
- Date-specific schedule overrides
- Day-off overrides
- Admin-only management

---

## Tech Stack

### Frontend

- Next.js
- JavaScript
- Tailwind CSS
- Axios
- Lucide React

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT
- Argon2 password hashing

### Database

- PostgreSQL
- Alembic migrations

### Development

- Git/GitHub
- FastAPI Swagger/OpenAPI documentation

---

## Project Structure

```text
physiodesk
┃── 📦backend
┃       ┣ 📂 Include
┃       ┣ 📂 Lib
┃       ┣ 📂 Scripts
┃       ┣ 📂 alembic
┃       ┣   ┣ 📂 versions
┃       ┣   ┣ 📜 env.py
┃       ┣   ┣ 📜 README    
┃       ┣ 📂 app
┃       ┣   ┣ 📂 __pycache__
┃       ┣   ┣ 📂 api
┃       ┣   ┣ 📂 core
┃       ┣   ┣ 📂 db
┃       ┣   ┣ 📂 models
┃       ┣   ┣ 📂 schemas
┃       ┣   ┣ 📂 services
┃       ┣   ┣ 📜 __init__.py
┃       ┣   ┣ 📜 main.py
┃       ┣   ┗ 📜 seed.py
┃       ┣ 📂 tests
┃       ┣ 📜 alembic.ini
┃       ┗ 📜 requirements.txt
┃── 📦frontend
┣       📂 public
┣       📂 src
┃       ┣ 📂 app
┃       ┣   ┣ 📂 billing
┃       ┣   ┣ 📂 login
┃       ┣   ┣ 📂 patients
┃       ┣   ┣ 📂 schedule
┃       ┣   ┣ 📂 therapists
┃       ┣   ┣ 📜 dashboard.css
┃       ┣   ┣ 📜 favicon.ico
┃       ┣   ┣ 📜 globals.css
┃       ┣   ┣ 📜 layout.js
┃       ┣   ┗ 📜 page.js
┃       ┣ 📂 components
┃       ┣   ┣ 📜 AppShell.js
┃       ┣   ┣ 📜 ProtectedRoute.js
┃       ┣   ┣ 📜 sidebar.css
┃       ┣   ┗ 📜 Sidebar.js
┃       ┣ 📂 context
┃       ┣   ┗ 📜 AuthContext.js
┃       ┗ 📂 lib
┃           ┗ 📜 api.js
┃── DATA.md
┃── QUESTION.md
┃── README.md

```
---

### Typography

1. Fraunces —> headings, page titles and key statistics
2. Inter —> body text, labels, buttons and UI
3. IBM Plex Mono —> numerical/data-oriented content

The UI uses a persistent dark sidebar, white content cards, status pills, tables, filters and modal-based forms as required by the specification.

---

### Requirements

Before running the application, install:
 1.  Python 3.11+ recommended
 2. Node.js 18+ recommended
 3. PostgreSQL 18+
 4. Git

--- 

### Backend Setup

1. Open a terminal in the project directory.
    - cd backend

2. Create a virtual environment:
    - python -m venv .venv

3. Activate it on Windows:
    - .venv\Scripts\activate

4. Install dependencies:
    - pip install -r requirements.txt

--- 

### Database Setup

1. Make sure PostgreSQL is running.
2. Create a PostgreSQL database named:\
    - physiodesk

3. The default local configuration used during development is:
    - Host: localhost
    - Port: 5432
    - Database: physiodesk
    - User: postgres

--- 

### Environment Variables

1. Create:
    - backend/.env

2. add data with:
    - DATABASE_URL=DATABASE_URI
    - SECRET_KEY=YOUR_LONG_RANDOM_SECRET_KEY

---

### Database Migration

1. alembic upgrade head 
This creates the database schema from the migration history.


### Seed Demo Data

1. Run
    python -m app.seed

2. The seed script creates demo users and sample clinic data including:

    - Admin and Staff users
    - Therapists
    - Therapist schedules
    - Schedule overrides
    - Patients
    - Past and future appointments
    - Paid and Due invoices
    - Users

The seed script is designed to avoid creating duplicate demo records when run again.

---

### Start Backend and Frontend
1. Backend
    - Go to Backend folder and run
        uvicorn app.main:app --reload
    - Open:
        http://127.0.0.1:8000/docs
    - And check API


2. Frontend
- Open new Terminal
- Go to frontend folder and install dependencies
    npm install
- Run the command
    npm run dev
- It is available at
    http://localhost:3000

---

### Scheduling Rules

1. Appointments are validated against the therapist's effective schedule.
2. The effective schedule is determined in this order:

- Date-specific schedule override
- Weekly therapist schedule
- No availability if neither exists

Appointments cannot be created outside the therapist's working hours.

Overlapping active appointments for the same therapist and date/time are rejected.

Cancelled and completed appointments are excluded from active double-booking checks.

--- 

### Application Workflow

A typical evaluation workflow is:

        Login
          ↓
        Dashboard
            ↓
        Patients
            ↓
        Patient Profile
            ↓
        Schedule
            ↓
        Book Appointment
                ↓
        Complete/Cancel/Reschedule
            ↓
        Billing
            ↓
        Create Invoice
              ↓
        Mark Invoice Paid
                 ↓
        Patient Billing History
                ↓
        Dashboard Reporting

--- 

### Scheduling Rules

Appointments are validated against the therapist's effective schedule.

The effective schedule is determined in this order:
1. Date-specific schedule override
2. Weekly therapist schedule
3. No availability if neither exists

Appointments cannot be created outside the therapist's working hours.

Overlapping active appointments for the same therapist and date/time are rejected.

Cancelled and completed appointments are excluded from active double-booking checks.

---

### Data Model

The main database entities are:

User
 │
 └── Authentication / Role

Therapist
 ├── TherapistSchedule
 └── TherapistScheduleOverride

Patient
 ├── Appointments
 └── Invoices

Appointment
 ├── Patient
 └── Therapist

Invoice
 └── Patient

Alembic is used to manage database schema changes.