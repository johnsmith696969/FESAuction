from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_active_user
from ..database import get_db
from ..schemas import MessageCreate, MessagePublic

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("", response_model=list[MessagePublic])
def list_messages(
    with_user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[MessagePublic]:
    query = db.query(models.Message).filter(
        or_(
            models.Message.sender_id == current_user.id,
            models.Message.recipient_id == current_user.id,
        )
    )
    if with_user_id is not None:
        query = query.filter(
            or_(
                models.Message.sender_id == with_user_id,
                models.Message.recipient_id == with_user_id,
            )
        )
    messages = query.order_by(models.Message.created_at.desc()).all()
    return messages


@router.post("", response_model=MessagePublic)
def send_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.Message:
    recipient = (
        db.query(models.User).filter(models.User.id == message_in.recipient_id).first()
    )
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if message_in.auction_id is not None:
        auction = (
            db.query(models.Auction)
            .filter(models.Auction.id == message_in.auction_id)
            .first()
        )
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")
    message = models.Message(
        body=message_in.body,
        auction_id=message_in.auction_id,
        sender_id=current_user.id,
        recipient_id=message_in.recipient_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
