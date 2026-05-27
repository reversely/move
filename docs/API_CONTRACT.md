# API Contract (PRD)

## Audio Analyzer Service (`apps/api`)

### `GET /health`

Response:

```json
{ "ok": true }
```

### `POST /analyze`

Request: `multipart/form-data` with `file`

Response:

```json
{
  "bpm": 127.8,
  "beat_times": [0.23, 0.7, 1.17],
  "onset_per_beat": [0.4, 1.2, 0.3],
  "percussive_ratio": 0.71,
  "spectral_bands": {
    "bass": 0.52,
    "mid": 0.33,
    "treble": 0.15
  },
  "key": "F#",
  "duration_seconds": 187.4
}
```

## Choreography Route (`apps/web`)

### `POST /api/choreograph`

Request:

```json
{
  "analysis": {
    "bpm": 127.8,
    "beat_times": [0.23, 0.7, 1.17],
    "onset_per_beat": [0.4, 1.2, 0.3],
    "percussive_ratio": 0.71,
    "spectral_bands": { "bass": 0.52, "mid": 0.33, "treble": 0.15 },
    "key": "F#",
    "duration_seconds": 187.4
  },
  "style": "hype",
  "phraseCount": 8
}
```

Response:

```json
{
  "phrases": [
    {
      "beat": 1,
      "duration_beats": 8,
      "keyframes": [
        {
          "frame_offset": 0,
          "joints": {
            "head": { "x": 0, "y": 0 }
          }
        }
      ]
    }
  ]
}
```
