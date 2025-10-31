from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    bio = Column(Text, default="")
    location = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    auctions = relationship("Auction", back_populates="owner")
    bids = relationship("Bid", back_populates="bidder")
    sent_messages = relationship(
        "Message",
        back_populates="sender",
        foreign_keys="Message.sender_id",
        cascade="all, delete-orphan",
    )
    received_messages = relationship(
        "Message",
        back_populates="recipient",
        foreign_keys="Message.recipient_id",
        cascade="all, delete-orphan",
    )
    transport_requests = relationship(
        "TransportQuoteRequest",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    financing_applications = relationship(
        "FinancingApplication",
        back_populates="user",
        cascade="all, delete-orphan",
    )


auction_category_table = Table(
    "auction_category_links",
    Base.metadata,
    Column("auction_id", Integer, ForeignKey("auctions.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)


class Auction(Base):
    __tablename__ = "auctions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    starting_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    sniping_extension_minutes = Column(Integer, default=2, nullable=False)
    sniping_window_minutes = Column(Integer, default=2, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    owner = relationship("User", back_populates="auctions")
    bids = relationship("Bid", back_populates="auction", cascade="all, delete-orphan")
    images = relationship(
        "AuctionImage",
        back_populates="auction",
        cascade="all, delete-orphan",
        order_by="AuctionImage.position",
    )
    categories = relationship(
        "Category",
        secondary=auction_category_table,
        back_populates="auctions",
    )
    transport_requests = relationship(
        "TransportQuoteRequest",
        back_populates="auction",
        cascade="all, delete-orphan",
    )
    financing_applications = relationship(
        "FinancingApplication",
        back_populates="auction",
        cascade="all, delete-orphan",
    )

    def extend_for_anti_sniping(self, now: datetime) -> None:
        window = timedelta(minutes=self.sniping_window_minutes)
        if self.end_time - now <= window:
            self.end_time = now + timedelta(minutes=self.sniping_extension_minutes)


class Bid(Base):
    __tablename__ = "bids"
    __table_args__ = (UniqueConstraint("auction_id", "amount", name="uq_bid_amount"),)

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    auction = relationship("Auction", back_populates="bids")
    bidder = relationship("User", back_populates="bids")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    auction = relationship("Auction")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship(
        "User", foreign_keys=[recipient_id], back_populates="received_messages"
    )


class AuctionImage(Base):
    __tablename__ = "auction_images"

    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)
    url = Column(String, nullable=False)
    position = Column(Integer, default=0, nullable=False)

    auction = relationship("Auction", back_populates="images")


class EmailSubscription(Base):
    __tablename__ = "email_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)

    auctions = relationship(
        "Auction",
        secondary=auction_category_table,
        back_populates="categories",
    )


class TransportQuoteRequest(Base):
    __tablename__ = "transport_quotes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    equipment_type = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    timeline = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    auction = relationship("Auction", back_populates="transport_requests")
    user = relationship("User", back_populates="transport_requests")


class FinancingApplication(Base):
    __tablename__ = "financing_applications"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    contact_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    timeline = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    auction = relationship("Auction", back_populates="financing_applications")
    user = relationship("User", back_populates="financing_applications")


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
