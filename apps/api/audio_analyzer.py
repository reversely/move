from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import librosa
except Exception as exc:  # pragma: no cover
    raise RuntimeError("librosa must be installed for audio analysis") from exc


PitchClass = Literal["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

ALLOWED_AUDIO_SUFFIXES = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".aiff", ".aif"}
GENERIC_BINARY_TYPES = {"application/octet-stream", "binary/octet-stream"}


def _scalar_float(value: float | np.ndarray | np.generic) -> float:
    """Coerce librosa/numpy outputs (often length-1 arrays) to a plain float."""
    arr = np.asarray(value)
    if arr.size == 0:
        return 0.0
    return float(arr.reshape(-1)[0])


class SpectralBands(BaseModel):
    bass: float
    mid: float
    treble: float


class AnalyzeResponse(BaseModel):
    bpm: float
    beat_times: list[float]
    onset_per_beat: list[float]
    percussive_ratio: float
    spectral_bands: SpectralBands
    key: PitchClass
    duration_seconds: float
    clip_start_seconds: float
    clip_end_seconds: float
    source_duration_seconds: float


app = FastAPI(title="Audio Analyzer Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _estimate_key(y: np.ndarray, sr: int) -> PitchClass:
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    pitch_idx = int(np.argmax(np.mean(chroma, axis=1)))
    labels: list[PitchClass] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    return labels[pitch_idx]


def _spectral_bands(y: np.ndarray, sr: int) -> SpectralBands:
    stft = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    energy = np.mean(stft, axis=1)

    bass_energy = float(np.sum(energy[freqs < 250]))
    mid_energy = float(np.sum(energy[(freqs >= 250) & (freqs < 2000)]))
    treble_energy = float(np.sum(energy[freqs >= 2000]))
    total = bass_energy + mid_energy + treble_energy
    if total <= 0:
        return SpectralBands(bass=0.33, mid=0.34, treble=0.33)

    return SpectralBands(
        bass=round(bass_energy / total, 4),
        mid=round(mid_energy / total, 4),
        treble=round(treble_energy / total, 4),
    )


def _onset_per_beat(y: np.ndarray, sr: int, beat_frames: np.ndarray) -> list[float]:
    envelope = librosa.onset.onset_strength(y=y, sr=sr)
    if len(beat_frames) == 0:
        # Fallback shape keeps frontend pipeline running even when no beat frames are found.
        return [0.5] * 8

    onset_values: list[float] = []
    max_env = float(np.max(envelope)) if len(envelope) else 1.0
    max_env = max(max_env, 1e-6)

    for beat_frame in beat_frames[:64]:
        frame = int(_scalar_float(beat_frame))
        idx = int(min(max(frame, 0), len(envelope) - 1))
        scaled = (float(envelope[idx]) / max_env) * 2.0
        onset_values.append(round(scaled, 3))
    return onset_values


def analyze_audio_file(
    file_path: Path,
    *,
    clip_start_seconds: float = 0.0,
    clip_end_seconds: float | None = None,
) -> AnalyzeResponse:
    y, sr = librosa.load(str(file_path), sr=None, mono=True)
    source_duration = float(librosa.get_duration(y=y, sr=sr))
    clip_start = max(0.0, clip_start_seconds)
    clip_end = source_duration if clip_end_seconds is None else min(source_duration, clip_end_seconds)
    if clip_end <= clip_start:
        clip_end = min(source_duration, clip_start + 5.0)
    start_sample = int(clip_start * sr)
    end_sample = int(clip_end * sr)
    y = y[start_sample:end_sample]
    duration = float(librosa.get_duration(y=y, sr=sr))

    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()[:64]

    y_harmonic, y_percussive = librosa.effects.hpss(y)
    harmonic_energy = float(np.sum(np.abs(y_harmonic)))
    percussive_energy = float(np.sum(np.abs(y_percussive)))
    percussive_ratio = percussive_energy / max(harmonic_energy + percussive_energy, 1e-6)

    return AnalyzeResponse(
        bpm=round(_scalar_float(tempo), 2),
        beat_times=[round(_scalar_float(t), 4) for t in beat_times],
        onset_per_beat=_onset_per_beat(y, sr, beat_frames),
        percussive_ratio=round(float(percussive_ratio), 4),
        spectral_bands=_spectral_bands(y, sr),
        key=_estimate_key(y, sr),
        duration_seconds=round(duration, 3),
        clip_start_seconds=round(clip_start, 3),
        clip_end_seconds=round(clip_end, 3),
        source_duration_seconds=round(source_duration, 3),
    )


def _is_allowed_audio_upload(filename: str | None, content_type: str | None) -> bool:
    suffix = Path(filename or "").suffix.lower()
    if suffix in ALLOWED_AUDIO_SUFFIXES:
        return True
    if content_type and content_type.startswith("audio/"):
        return True
    if content_type in GENERIC_BINARY_TYPES and suffix:
        return True
    return False


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    start_seconds: float = Form(0.0),
    end_seconds: float | None = Form(None),
) -> AnalyzeResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")
    if not _is_allowed_audio_upload(file.filename, file.content_type):
        raise HTTPException(
            status_code=400,
            detail="Only MP3 or WAV audio uploads are supported",
        )

    suffix = Path(file.filename).suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = Path(tmp.name)
        tmp.write(await file.read())

    try:
        return analyze_audio_file(
            tmp_path,
            clip_start_seconds=start_seconds,
            clip_end_seconds=end_seconds,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to analyze audio: {exc}") from exc
    finally:
        tmp_path.unlink(missing_ok=True)
