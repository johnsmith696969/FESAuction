from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_admin
from ..database import get_db
from ..schemas import EmailSubscriptionCreate, EmailSubscriptionPublic

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("", response_model=EmailSubscriptionPublic, status_code=status.HTTP_201_CREATED)
def create_subscription(
    subscription_in: EmailSubscriptionCreate,
    db: Session = Depends(get_db),
) -> models.EmailSubscription:
    existing = (
        db.query(models.EmailSubscription)
        .filter(models.EmailSubscription.email == subscription_in.email)
        .first()
    )
    if existing:
        return existing
    subscription = models.EmailSubscription(email=subscription_in.email)
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("", response_model=list[EmailSubscriptionPublic])
def list_subscriptions(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
) -> list[models.EmailSubscription]:
    return (
        db.query(models.EmailSubscription)
        .order_by(models.EmailSubscription.created_at.desc())
        .all()
    )
