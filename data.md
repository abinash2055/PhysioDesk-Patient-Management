## USERS 

**ADMIN** 
{
  "email": "admin@physiodesk.com",
  "password": "Admin@123"
}

**STAFF**
{
  "email": "staff@physiodesk.com",
  "password": "Staff@123"
}

-------------------------
-------------------------

## Git Commit History

Open Terminal and type
    "git log --oneline"

-------------------------
-------------------------

Frontend: npm run dev
backend: uvicorn app.main:app --reload


## Patient Data

1. 
{
  "name": "Aarav Sharma",
  "phone": "9800000001",
  "age": 32,
  "gender": "Male",
  "address": "Kathmandu",
  "condition": "Lower back pain",
  "therapist_id": null,
  "package": "10 Sessions"
}
---

2. 
{
  "name": "Ajita Thapa",
  "phone": "9805600001",
  "age": 26,
  "gender": "Female",
  "address": "Kapilvastu",
  "condition": "Knee pain",
  "therapist_id": null,
  "package": "8 Sessions"
}
---

3. 
{
  "name": "Arjun Kunwar",
  "phone": "9898000001",
  "age": 52,
  "gender": "Male",
  "address": "Rasuwa",
  "condition": "ENT problem",
  "therapist_id": null,
  "package": "12 Sessions"
}
---

4. 
{
  "name": "Samjhana Dhungana",
  "phone": "9898754001",
  "age": 42,
  "gender": "Female",
  "address": "Thankot",
  "condition": "Neck problem",
  "therapist_id": null,
  "package": "12 Sessions"
}
---
---


## Therapists Data
1. 
{
  "name": "Dr. Priya Sharma",
  "specialty": "Orthopedic Physiotherapy"
}

2. 
{
  "name": "Dr. Rohan Thapa",
  "specialty": "Physiotherapy"
}

3. 
{
  "name": "Dr. Abinash Pandey",
  "specialty": "Cardiology"
}
---
---


## Billing Data
1. 
{
  "patient_id": 1,
  "service": "Physiotherapy Session",
  "amount": 1500.00,
  "discount": 100.00,
  "status": "Due",
  "payment_method": null,
  "invoice_date": "2026-09-24"
}

2. 
{
  "patient_id": 1,
  "service": "Physiotherapy ECG",
  "amount": 1200.00,
  "discount": 800.00,
  "status": "Paid",
  "payment_method": null,
  "invoice_date": "2026-09-25"
}