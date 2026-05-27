from fastapi import APIRouter, File, HTTPException, UploadFile

from models.song import AnalyzeSongRequest, SongAnalysis, SongUploadResponse
from services.audio_analysis import analyze_audio
from services.storage import find_song_file, save_upload

router = APIRouter()


@router.post("/upload", response_model=SongUploadResponse)
async def upload_song(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    song_id, stored_name = save_upload(file.filename or "song.mp3", content)
    return SongUploadResponse(
        songId=song_id,
        fileName=file.filename or stored_name,
        audioUrl=f"/uploads/{stored_name}",
    )


@router.post("/analyze", response_model=SongAnalysis)
def analyze_song(request: AnalyzeSongRequest):
    file_path = find_song_file(request.songId)
    if not file_path:
        raise HTTPException(status_code=404, detail="Song not found")

    analysis = analyze_audio(file_path)
    return SongAnalysis(songId=request.songId, **analysis)
