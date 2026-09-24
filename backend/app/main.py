from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.therapists import router as therapists_router
from app.api.appointments import router as appointments_router
from app.api.invoices import router as invoices_router

app = FastAPI(
    title="PhysioDesk API",
    description="API for PhysioDesk Clinic Management System",
    version="1.0.0",
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "PhysioDesk API",
    }

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(therapists_router)
app.include_router(appointments_router)
app.include_router(invoices_router)
