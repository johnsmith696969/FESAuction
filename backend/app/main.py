from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import Base, SessionLocal, engine, ensure_sqlite_schema
from .routers import (
    auctions,
    auth,
    catalog,
    contact,
    media,
    messages,
    services,
    subscriptions,
    users,
)

Base.metadata.create_all(bind=engine)
ensure_sqlite_schema()


DEFAULT_CATEGORIES = [
    {
        "name": "Excavators",
        "slug": "excavators",
        "description": "Crawler, wheeled, and mini excavators for utility and heavy civil jobs.",
    },
    {
        "name": "Dozers",
        "slug": "dozers",
        "description": "Finish and heavy dozers with GPS-ready grade control packages.",
    },
    {
        "name": "Wheel Loaders",
        "slug": "wheel-loaders",
        "description": "Tool carriers and high-lift loaders for aggregates and yard work.",
    },
    {
        "name": "Skid Steers",
        "slug": "skid-steers",
        "description": "Vertical and radial lift skid steers plus attachments.",
    },
    {
        "name": "Agriculture",
        "slug": "agriculture",
        "description": "Combines, planters, sprayers, and specialty ag equipment.",
    },
    {
        "name": "Trucks & Trailers",
        "slug": "trucks-trailers",
        "description": "Lowboys, dump trucks, and vocational tractors ready to haul.",
    },
    {
        "name": "Crushing & Screening",
        "slug": "crushing-screening",
        "description": "Jaw, cone, and impact crushers with matching screen plants.",
    },
]


def seed_default_categories() -> None:
    with SessionLocal() as session:
        existing = {
            category.slug: category
            for category in session.query(models.Category).all()
        }
        created = False
        for payload in DEFAULT_CATEGORIES:
            if payload["slug"] not in existing:
                session.add(models.Category(**payload))
                created = True
        if created:
            session.commit()


seed_default_categories()

app = FastAPI(title="FES Auction Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(auctions.router)
app.include_router(messages.router)
app.include_router(media.router)
app.include_router(catalog.router)
app.include_router(services.router)
app.include_router(subscriptions.router)
app.include_router(contact.router)

upload_root = Path(__file__).resolve().parent / "uploads"
upload_root.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=upload_root), name="media")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
