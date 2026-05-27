import uuid
from pathlib import Path

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"


def save_upload(file_name: str, content: bytes) -> tuple[str, str]:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file_name).suffix or ".mp3"
    song_id = f"song_{uuid.uuid4().hex[:8]}"
    stored_name = f"{song_id}{ext}"
    file_path = UPLOADS_DIR / stored_name
    file_path.write_bytes(content)

    return song_id, stored_name


def find_song_file(song_id: str) -> Path | None:
    if not UPLOADS_DIR.exists():
        return None

    matches = list(UPLOADS_DIR.glob(f"{song_id}.*"))
    if not matches:
        return None
    return matches[0]
