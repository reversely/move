# API Contract

## Health

- `GET /health`
- Response: `{ "ok": true }`

## Upload Song

- `POST /songs/upload` with `multipart/form-data` field `file`
- Response: `{ "songId": "...", "fileName": "...", "audioUrl": "/uploads/..." }`

## Analyze Song

- `POST /songs/analyze`
- Body: `{ "songId": "song_abc123" }`
- Response: `{ "songId": "...", "bpm": 120, "durationSeconds": 30, "beats": [0, 0.5] }`

## Generate Dance

- `POST /dances/generate`
- Body: `{ "songId": "...", "bpm": 120, "style": "fun", "difficulty": "easy", "totalBeats": 8 }`
- Response: `DancePlan`
