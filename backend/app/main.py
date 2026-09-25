from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.therapists import router as therapists_router
from app.api.appointments import router as appointments_router
from app.api.invoices import router as invoices_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title="PhysioDesk API",
    description="API for PhysioDesk Clinic Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://physio-desk-patient-management.vercel.app",
        "https://physio-desk-patient-ma-git-1f36c3-abinash-nath-pandeys-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(therapists_router)
app.include_router(appointments_router)
app.include_router(invoices_router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "PhysioDesk API",
    }
