from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./auction.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_sqlite_schema() -> None:
    inspector = sa_inspect(engine)
    with engine.connect() as connection:
        try:
            user_columns = {column["name"] for column in inspector.get_columns("users")}
        except NoSuchTableError:
            return
        if "location" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR"))
        if "phone" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
        if "avatar_url" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))

        auction_columns = {column["name"] for column in inspector.get_columns("auctions")}
        if "location" not in auction_columns:
            connection.execute(text("ALTER TABLE auctions ADD COLUMN location VARCHAR"))


@contextmanager
def session_scope() -> Generator:
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
