from __future__ import annotations

import mimetypes
import secrets
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..auth import get_current_active_user, get_current_admin
from ..schemas import UploadResponse

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
AVATAR_DIR = UPLOAD_ROOT / "avatars"
AUCTION_DIR = UPLOAD_ROOT / "auctions"

for directory in (AVATAR_DIR, AUCTION_DIR):
    directory.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

router = APIRouter(prefix="/media", tags=["media"])


def _extension_for(content_type: str) -> str:
    extension = mimetypes.guess_extension(content_type)
    if not extension:
        if content_type == "image/jpeg":
            return ".jpg"
        if content_type == "image/png":
            return ".png"
        if content_type == "image/gif":
            return ".gif"
        if content_type == "image/webp":
            return ".webp"
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )
    return extension


def _persist_upload(upload: UploadFile, directory: Path) -> tuple[str, int]:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )
    extension = _extension_for(upload.content_type)
    filename = f"{secrets.token_hex(16)}{extension}"
    destination = directory / filename
    size = 0
    with destination.open("wb") as buffer:
        for chunk in iter(lambda: upload.file.read(1024 * 1024), b""):
            size += len(chunk)
            buffer.write(chunk)
    upload.file.close()
    relative_path = destination.relative_to(UPLOAD_ROOT)
    url = f"/media/{relative_path.as_posix()}"
    return url, size


@router.post("/avatar", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_active_user),
) -> UploadResponse:
    url, size = _persist_upload(file, AVATAR_DIR)
    return UploadResponse(url=url, content_type=file.content_type or "image/jpeg", size=size)


@router.post("/auction", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_auction_media(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
) -> UploadResponse:
    url, size = _persist_upload(file, AUCTION_DIR)
    return UploadResponse(url=url, content_type=file.content_type or "image/jpeg", size=size)
