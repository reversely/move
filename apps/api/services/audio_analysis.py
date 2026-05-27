from pathlib import Path


def analyze_audio(file_path: Path):
    try:
        import librosa

        y, sr = librosa.load(str(file_path), sr=None)
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()
        duration = librosa.get_duration(y=y, sr=sr)

        return {
            "bpm": int(round(float(tempo))),
            "durationSeconds": float(duration),
            "beats": beat_times,
        }
    except Exception:
        return {
            "bpm": 120,
            "durationSeconds": 30,
            "beats": [i * 0.5 for i in range(64)],
        }
