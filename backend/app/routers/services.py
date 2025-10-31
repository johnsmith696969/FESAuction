from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_admin, get_current_user_optional
from ..database import get_db
from ..schemas import (
    FinancingApplicationCreate,
    FinancingApplicationPublic,
    TransportQuoteCreate,
    TransportQuotePublic,
)

router = APIRouter(prefix="/services", tags=["services"])


@router.post(
    "/transport/quotes",
    response_model=TransportQuotePublic,
    status_code=status.HTTP_201_CREATED,
)
def request_transport_quote(
    quote_in: TransportQuoteCreate,
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_current_user_optional),
) -> TransportQuotePublic:
    if quote_in.auction_id is not None:
        auction = (
            db.query(models.Auction)
            .filter(models.Auction.id == quote_in.auction_id)
            .first()
        )
        if auction is None:
            raise HTTPException(status_code=404, detail="Auction not found")
    quote = models.TransportQuoteRequest(
        name=quote_in.name,
        email=quote_in.email,
        phone=quote_in.phone,
        origin=quote_in.origin,
        destination=quote_in.destination,
        equipment_type=quote_in.equipment_type,
        weight=quote_in.weight,
        timeline=quote_in.timeline,
        notes=quote_in.notes,
        auction_id=quote_in.auction_id,
        user_id=user.id if user else None,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


@router.get(
    "/transport/quotes",
    response_model=list[TransportQuotePublic],
)
def list_transport_quotes(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(get_current_admin),
) -> list[TransportQuotePublic]:
    return (
        db.query(models.TransportQuoteRequest)
        .order_by(models.TransportQuoteRequest.created_at.desc())
        .all()
    )


@router.post(
    "/financing/applications",
    response_model=FinancingApplicationPublic,
    status_code=status.HTTP_201_CREATED,
)
def submit_financing_application(
    application_in: FinancingApplicationCreate,
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_current_user_optional),
) -> FinancingApplicationPublic:
    if application_in.auction_id is not None:
        auction = (
            db.query(models.Auction)
            .filter(models.Auction.id == application_in.auction_id)
            .first()
        )
        if auction is None:
            raise HTTPException(status_code=404, detail="Auction not found")
    application = models.FinancingApplication(
        business_name=application_in.business_name,
        contact_name=application_in.contact_name,
        email=application_in.email,
        phone=application_in.phone,
        amount=application_in.amount,
        timeline=application_in.timeline,
        notes=application_in.notes,
        auction_id=application_in.auction_id,
        user_id=user.id if user else None,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get(
    "/financing/applications",
    response_model=list[FinancingApplicationPublic],
)
def list_financing_applications(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(get_current_admin),
) -> list[FinancingApplicationPublic]:
    return (
        db.query(models.FinancingApplication)
        .order_by(models.FinancingApplication.created_at.desc())
        .all()
    )
