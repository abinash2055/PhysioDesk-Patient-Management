from fastapi import FastAPI
from app.api.auth import router as auth_router

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