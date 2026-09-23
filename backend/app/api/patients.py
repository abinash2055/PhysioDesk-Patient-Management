from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)

router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"],
)


def get_therapist_or_404(
    therapist_id: int,
    db: Session,
) -> Therapist:

    therapist = db.get(Therapist, therapist_id)

    if therapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    if not therapist.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign an inactive therapist",
        )

    return therapist


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if patient_data.therapist_id is not None:
        get_therapist_or_404(
            patient_data.therapist_id,
            db,
        )

    patient = Patient(
        name=patient_data.name,
        phone=patient_data.phone,
        age=patient_data.age,
        gender=patient_data.gender,
        address=patient_data.address,
        condition=patient_data.condition,
        therapist_id=patient_data.therapist_id,
        package=patient_data.package,
        status="Active",
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient


@router.get(
    "",
    response_model=list[PatientResponse],
)

def list_patients(
    search: str | None = Query(
        default=None,
        description="Search by patient name or phone",
    ),
    therapist_id: int | None = Query(default=None),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Patient)

    if search:
        search_term = f"%{search.strip()}%"

        query = query.where(
            or_(
                Patient.name.ilike(search_term),
                Patient.phone.ilike(search_term),
            )
        )

    if therapist_id is not None:
        query = query.where(
            Patient.therapist_id == therapist_id
        )

    if status_filter:
        query = query.where(
            Patient.status == status_filter
        )

    query = query.order_by(
        Patient.created_at.desc()
    )

    result = db.execute(query)

    return result.scalars().all()

@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return patient


@router.put(
    "/{patient_id}",
    response_model=PatientResponse,
)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    update_data = patient_data.model_dump(
        exclude_unset=True
    )

    if "therapist_id" in update_data:
        therapist_id = update_data["therapist_id"]

        if therapist_id is not None:
            get_therapist_or_404(
                therapist_id,
                db,
            )

    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.patch(
    "/{patient_id}/deactivate",
    response_model=PatientResponse,
)

def deactivate_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    patient.status = "Inactive"

    db.commit()
    db.refresh(patient)

    return patient