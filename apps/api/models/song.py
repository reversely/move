from pydantic import BaseModel


class SongUploadResponse(BaseModel):
    songId: str
    fileName: str
    audioUrl: str


class AnalyzeSongRequest(BaseModel):
    songId: str


class SongAnalysis(BaseModel):
    songId: str
    bpm: int
    durationSeconds: float
    beats: list[float]
