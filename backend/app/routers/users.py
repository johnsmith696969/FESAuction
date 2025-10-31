from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_active_user
from ..database import get_db
from ..schemas import UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
def get_me(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    return current_user


@router.put("/me", response_model=UserPublic)
def update_me(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    if update.display_name is not None:
        current_user.display_name = update.display_name
    if update.bio is not None:
        current_user.bio = update.bio
    if update.location is not None:
        current_user.location = update.location
    if update.phone is not None:
        current_user.phone = update.phone
    if update.avatar_url is not None:
        current_user.avatar_url = update.avatar_url
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: int, db: Session = Depends(get_db)) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
