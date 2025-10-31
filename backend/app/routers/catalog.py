from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import CategoryPublic, SupportProgramPublic

router = APIRouter(prefix="/catalog", tags=["catalog"])

SUPPORT_PROGRAMS: list[SupportProgramPublic] = [
    SupportProgramPublic(
        slug="prime-haul",
        name="Prime Haul Logistics",
        summary="Door-to-door heavy haul with optional load insurance and dedicated dispatch.",
        category="transport",
        contact_email="dispatch@primehaul.com",
        contact_phone="1-888-555-4120",
        turnaround="Quotes in under 2 hours",
    ),
    SupportProgramPublic(
        slug="ironshield-finance",
        name="IronShield Capital",
        summary="Flexible term sheets for earthmoving, forestry, and agricultural fleets.",
        category="financing",
        contact_email="hello@ironshieldcapital.com",
        contact_phone="1-800-204-1122",
        turnaround="Approvals within 24 hours",
    ),
    SupportProgramPublic(
        slug="precision-inspection",
        name="Precision Inspection Network",
        summary="Certified equipment inspectors in 280+ markets with same-week availability.",
        category="inspection",
        contact_email="schedule@precisioninspect.com",
        contact_phone="1-877-900-4477",
        turnaround="Site visit within 3 business days",
    ),
]


@router.get("/categories", response_model=list[CategoryPublic])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryPublic]:
    return (
        db.query(models.Category)
        .order_by(models.Category.name.asc())
        .all()
    )


@router.get("/support-programs", response_model=list[SupportProgramPublic])
def list_support_programs() -> list[SupportProgramPublic]:
    return SUPPORT_PROGRAMS
