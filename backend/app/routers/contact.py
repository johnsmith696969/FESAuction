from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_admin
from ..database import get_db
from ..schemas import ContactRequestCreate, ContactRequestPublic

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactRequestPublic, status_code=status.HTTP_201_CREATED)
def create_contact_request(
    request_in: ContactRequestCreate,
    db: Session = Depends(get_db),
) -> ContactRequestPublic:
    request = models.ContactRequest(
        first_name=request_in.first_name,
        last_name=request_in.last_name,
        email=request_in.email,
        phone=request_in.phone,
        company=request_in.company,
        topic=request_in.topic,
        message=request_in.message,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("", response_model=list[ContactRequestPublic])
def list_contact_requests(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(get_current_admin),
) -> list[ContactRequestPublic]:
    return (
        db.query(models.ContactRequest)
        .order_by(models.ContactRequest.created_at.desc())
        .all()
    )
