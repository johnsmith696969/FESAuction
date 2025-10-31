from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, selectinload

from .. import models
from ..auth import get_current_active_user, get_current_admin
from ..database import get_db
from ..schemas import (
    AuctionCreate,
    AuctionImagePublic,
    AuctionPublic,
    AuctionUpdate,
    BidPublic,
    CategoryPublic,
)

router = APIRouter(prefix="/auctions", tags=["auctions"])


def _auction_query(db: Session):
    return db.query(models.Auction).options(
        selectinload(models.Auction.owner),
        selectinload(models.Auction.images),
        selectinload(models.Auction.bids).selectinload(models.Bid.bidder),
        selectinload(models.Auction.categories),
    )


def _auction_status(auction: models.Auction, now: datetime) -> tuple[str, int]:
    if now < auction.start_time:
        return "upcoming", int((auction.start_time - now).total_seconds())
    if now >= auction.end_time:
        return "completed", 0
    return "active", max(int((auction.end_time - now).total_seconds()), 0)


def _serialize_auction(auction: models.Auction, now: datetime) -> AuctionPublic:
    status, time_remaining = _auction_status(auction, now)
    bids = [
        BidPublic(
            id=bid.id,
            amount=bid.amount,
            created_at=bid.created_at,
            bidder=bid.bidder,
        )
        for bid in sorted(auction.bids, key=lambda b: b.created_at, reverse=True)
    ]
    categories = [
        CategoryPublic(
            id=category.id,
            name=category.name,
            slug=category.slug,
            description=category.description,
        )
        for category in sorted(auction.categories, key=lambda c: c.name.lower())
    ]
    gallery = [
        AuctionImagePublic(id=image.id, url=image.url, position=image.position)
        for image in auction.images
    ]
    return AuctionPublic(
        id=auction.id,
        title=auction.title,
        description=auction.description,
        starting_price=auction.starting_price,
        image_url=auction.image_url,
        location=auction.location,
        start_time=auction.start_time,
        end_time=auction.end_time,
        sniping_extension_minutes=auction.sniping_extension_minutes,
        sniping_window_minutes=auction.sniping_window_minutes,
        owner=auction.owner,
        current_price=auction.current_price,
        created_at=auction.created_at,
        updated_at=auction.updated_at,
        bids=bids,
        gallery=gallery,
        status=status,
        time_remaining_seconds=time_remaining,
        categories=categories,
    )


def _load_categories(slugs: list[str], db: Session) -> list[models.Category]:
    if not slugs:
        return []
    categories = (
        db.query(models.Category)
        .filter(models.Category.slug.in_(slugs))
        .all()
    )
    found = {category.slug: category for category in categories}
    missing = [slug for slug in slugs if slug not in found]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown categories: {', '.join(missing)}",
        )
    return [found[slug] for slug in slugs]


@router.get("", response_model=list[AuctionPublic])
def list_auctions(db: Session = Depends(get_db)) -> list[AuctionPublic]:
    auctions = _auction_query(db).order_by(asc(models.Auction.end_time)).all()
    now = datetime.utcnow()
    return [_serialize_auction(auction, now) for auction in auctions]


@router.get("/{auction_id}", response_model=AuctionPublic)
def get_auction(auction_id: int, db: Session = Depends(get_db)) -> AuctionPublic:
    auction = _auction_query(db).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return _serialize_auction(auction, datetime.utcnow())


@router.post("", response_model=AuctionPublic, status_code=status.HTTP_201_CREATED)
def create_auction(
    auction_in: AuctionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
) -> AuctionPublic:
    if auction_in.end_time <= auction_in.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    auction = models.Auction(
        title=auction_in.title,
        description=auction_in.description,
        starting_price=auction_in.starting_price,
        current_price=auction_in.starting_price,
        image_url=auction_in.image_url,
        location=auction_in.location,
        start_time=auction_in.start_time,
        end_time=auction_in.end_time,
        sniping_extension_minutes=auction_in.sniping_extension_minutes,
        sniping_window_minutes=auction_in.sniping_window_minutes,
        owner_id=admin.id,
    )
    if auction_in.gallery_urls:
        for idx, url in enumerate(auction_in.gallery_urls):
            auction.images.append(models.AuctionImage(url=url, position=idx))
        if not auction.image_url:
            auction.image_url = auction_in.gallery_urls[0]
    auction.categories = _load_categories(auction_in.category_slugs, db)
    db.add(auction)
    db.commit()
    db.refresh(auction)
    fresh = _auction_query(db).filter(models.Auction.id == auction.id).first()
    return _serialize_auction(fresh, datetime.utcnow())


@router.put("/{auction_id}", response_model=AuctionPublic)
def update_auction(
    auction_id: int,
    auction_update: AuctionUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
) -> AuctionPublic:
    auction = _auction_query(db).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    update_data = auction_update.dict(exclude_unset=True)
    gallery_urls = update_data.pop("gallery_urls", None)
    category_slugs = update_data.pop("category_slugs", None)
    for field, value in update_data.items():
        setattr(auction, field, value)

    if gallery_urls is not None:
        auction.images.clear()
        for idx, url in enumerate(gallery_urls):
            auction.images.append(models.AuctionImage(url=url, position=idx))
        if gallery_urls and not auction.image_url:
            auction.image_url = gallery_urls[0]
    if category_slugs is not None:
        auction.categories = _load_categories(category_slugs, db)
    db.add(auction)
    db.commit()
    db.refresh(auction)
    fresh = _auction_query(db).filter(models.Auction.id == auction.id).first()
    return _serialize_auction(fresh, datetime.utcnow())


@router.delete("/{auction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auction(
    auction_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
) -> None:
    auction = _auction_query(db).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    db.delete(auction)
    db.commit()


@router.post("/{auction_id}/bids", response_model=AuctionPublic)
def place_bid(
    auction_id: int,
    amount: float,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_active_user),
) -> AuctionPublic:
    auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    now = datetime.utcnow()
    if now < auction.start_time:
        raise HTTPException(status_code=400, detail="Auction has not started")
    if now >= auction.end_time:
        raise HTTPException(status_code=400, detail="Auction has ended")

    highest_bid = (
        db.query(models.Bid)
        .filter(models.Bid.auction_id == auction_id)
        .order_by(desc(models.Bid.amount))
        .first()
    )

    minimum = highest_bid.amount if highest_bid else auction.starting_price
    if amount <= minimum:
        raise HTTPException(status_code=400, detail="Bid must be higher than current price")

    bid = models.Bid(amount=amount, auction_id=auction_id, bidder_id=user.id)
    auction.current_price = amount
    auction.extend_for_anti_sniping(now)
    db.add(bid)
    db.add(auction)
    db.commit()
    db.refresh(auction)
    fresh = _auction_query(db).filter(models.Auction.id == auction.id).first()
    return _serialize_auction(fresh, datetime.utcnow())
