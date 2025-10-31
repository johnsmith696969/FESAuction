from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    is_admin: bool


class UserBase(BaseModel):
    email: EmailStr
    display_name: str = Field(..., max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=40)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    is_admin: bool | None = False


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=40)
    avatar_url: Optional[str] = None


class UserPublic(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        orm_mode = True


class AuctionBase(BaseModel):
    title: str
    description: str
    starting_price: float
    image_url: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    sniping_extension_minutes: int = Field(2, ge=1, le=30)
    sniping_window_minutes: int = Field(2, ge=1, le=30)


class AuctionCreate(AuctionBase):
    gallery_urls: Optional[list[str]] = Field(default_factory=list)
    category_slugs: list[str] = Field(default_factory=list)


class AuctionUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    location: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    sniping_extension_minutes: Optional[int]
    sniping_window_minutes: Optional[int]
    gallery_urls: Optional[list[str]]
    category_slugs: Optional[list[str]]


class BidPublic(BaseModel):
    id: int
    amount: float
    created_at: datetime
    bidder: UserPublic

    class Config:
        orm_mode = True


class AuctionImagePublic(BaseModel):
    id: int
    url: str
    position: int

    class Config:
        orm_mode = True


class AuctionPublic(AuctionBase):
    id: int
    owner: UserPublic
    current_price: float
    created_at: datetime
    updated_at: datetime
    bids: list[BidPublic] = Field(default_factory=list)
    gallery: list[AuctionImagePublic] = Field(default_factory=list)
    status: str
    time_remaining_seconds: int
    categories: list["CategoryPublic"] = Field(default_factory=list)

    class Config:
        orm_mode = True


class CategoryPublic(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]

    class Config:
        orm_mode = True


class MessageCreate(BaseModel):
    recipient_id: int
    body: str
    auction_id: Optional[int] = None


class MessagePublic(BaseModel):
    id: int
    body: str
    created_at: datetime
    auction_id: Optional[int]
    sender: UserPublic
    recipient: UserPublic

    class Config:
        orm_mode = True


class UploadResponse(BaseModel):
    url: str
    content_type: str
    size: int


class EmailSubscriptionCreate(BaseModel):
    email: EmailStr


class EmailSubscriptionPublic(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        orm_mode = True


class TransportQuoteCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    origin: str
    destination: str
    equipment_type: Optional[str] = None
    weight: Optional[str] = None
    timeline: Optional[str] = None
    notes: Optional[str] = None
    auction_id: Optional[int] = None


class TransportQuotePublic(TransportQuoteCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class FinancingApplicationCreate(BaseModel):
    business_name: str
    contact_name: str
    email: EmailStr
    phone: str
    amount: float
    timeline: Optional[str] = None
    notes: Optional[str] = None
    auction_id: Optional[int] = None


class FinancingApplicationPublic(FinancingApplicationCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class ContactRequestCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    topic: Optional[str] = None
    message: str


class ContactRequestPublic(ContactRequestCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class SupportProgramPublic(BaseModel):
    slug: str
    name: str
    summary: str
    category: Literal["transport", "financing", "inspection"]
    contact_email: str
    contact_phone: str
    turnaround: str


AuctionPublic.update_forward_refs(CategoryPublic=CategoryPublic)
