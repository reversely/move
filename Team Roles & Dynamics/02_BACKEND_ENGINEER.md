# Person 2: Backend Engineer

## Mission

Build the FastAPI backend that handles song upload, basic audio analysis, and dance plan generation.

Your job is to make the API stable. The frontend and avatar system depend on your response shapes.

## Owned Areas

You own these paths:

```txt
apps/api/
apps/api/main.py
apps/api/routes/
apps/api/services/
apps/api/schemas/
apps/api/data/
apps/api/uploads/
```

You may also create new backend files inside `apps/api`.

## Do Not Touch

Avoid editing these paths unless the whole team agrees:

```txt
apps/web/components/
packages/avatar-player/
packages/dance-core/
public/avatars/
public/animations/
```

Do not change frontend components to fit backend behavior. Keep the API contract stable instead.

## Main Responsibilities

### 1. FastAPI app

Build:

```txt
apps/api/main.py
```

It should:

```txt
Start FastAPI app
Enable CORS for local frontend
Mount upload route
Mount analyze route
Mount generate dance route
Expose health check
```

### 2. Health route

Build:

```txt
apps/api/routes/health.py
```

Endpoint:

```txt
GET /api/health
```

Response:

```json
{
  "ok": true
}
```

### 3. Song upload route

Build:

```txt
apps/api/routes/songs.py
```

Endpoint:

```txt
POST /api/songs/upload
```

Responsibilities:

```txt
Accept audio file
Generate songId
Save file locally to apps/api/uploads
Return songId and fileUrl
Validate file extension lightly
Handle errors cleanly
```

Response:

```json
{
  "songId": "song_abc123",
  "fileUrl": "/uploads/song_abc123.mp3"
}
```

### 4. Song analysis route

Endpoint:

```txt
POST /api/songs/analyze
```

Request:

```json
{
  "songId": "song_abc123"
}
```

Response:

```json
{
  "songId": "song_abc123",
  "bpm": 120,
  "durationSeconds": 32,
  "beats": [0, 0.5, 1.0, 1.5]
}
```

For v1, start with a stub:

```txt
bpm = 120
durationSeconds = 32
beats = every 0.5 seconds
```

After the contract works, add librosa.

### 5. Dance generation route

Build:

```txt
apps/api/routes/dances.py
apps/api/services/dance_generator.py
```

Endpoint:

```txt
POST /api/dances/generate
```

Request:

```json
{
  "songId": "song_abc123",
  "style": "fun",
  "difficulty": "easy",
  "totalBeats": 8
}
```

Response:

```json
{
  "songId": "song_abc123",
  "bpm": 120,
  "dance": {
    "id": "dance_abc123",
    "style": "fun",
    "difficulty": "easy",
    "totalBeats": 8,
    "moves": [
      {
        "startBeat": 1,
        "endBeat": 2,
        "moveId": "step_touch",
        "label": "Step right, then left",
        "animationClip": "step_touch.glb"
      }
    ]
  }
}
```

## Move Library

Create:

```txt
apps/api/data/move_library.json
```

Starter content:

```json
[
  {
    "id": "step_touch",
    "name": "Step Touch",
    "label": "Step right, then left",
    "difficulty": "easy",
    "styleTags": ["fun", "cool", "cute"],
    "durationBeats": 2,
    "animationClip": "step_touch.glb",
    "compatibleNext": ["clap", "point_forward", "shoulder_bounce"]
  },
  {
    "id": "clap",
    "name": "Clap",
    "label": "Clap twice on the beat",
    "difficulty": "easy",
    "styleTags": ["fun", "high_energy"],
    "durationBeats": 2,
    "animationClip": "clap.glb",
    "compatibleNext": ["point_forward", "freeze_pose"]
  },
  {
    "id": "point_forward",
    "name": "Point Forward",
    "label": "Point to the camera",
    "difficulty": "easy",
    "styleTags": ["fun", "cool"],
    "durationBeats": 2,
    "animationClip": "point_forward.glb",
    "compatibleNext": ["freeze_pose", "shoulder_bounce"]
  },
  {
    "id": "freeze_pose",
    "name": "Freeze Pose",
    "label": "Hold a final pose",
    "difficulty": "easy",
    "styleTags": ["fun", "cool", "cute", "high_energy"],
    "durationBeats": 2,
    "animationClip": "freeze_pose.glb",
    "compatibleNext": []
  }
]
```

## Backend Skeleton

Create this shape:

```txt
apps/api/
  main.py
  requirements.txt
  routes/
    health.py
    songs.py
    dances.py
  services/
    storage.py
    audio_analysis.py
    dance_generator.py
  schemas/
    dance.py
  data/
    move_library.json
  uploads/
    .gitkeep
```

## Pydantic Schemas

Create:

```txt
apps/api/schemas/dance.py
```

Suggested models:

```py
from pydantic import BaseModel
from typing import List

class UploadSongResponse(BaseModel):
    songId: str
    fileUrl: str

class AnalyzeSongRequest(BaseModel):
    songId: str

class AnalyzeSongResponse(BaseModel):
    songId: str
    bpm: int
    durationSeconds: float
    beats: List[float]

class GenerateDanceRequest(BaseModel):
    songId: str
    style: str
    difficulty: str
    totalBeats: int = 8

class DanceMove(BaseModel):
    startBeat: int
    endBeat: int
    moveId: str
    label: str
    animationClip: str

class Dance(BaseModel):
    id: str
    style: str
    difficulty: str
    totalBeats: int
    moves: List[DanceMove]

class GenerateDanceResponse(BaseModel):
    songId: str
    bpm: int
    dance: Dance
```

## Allowed Extra Work

You can also do these tasks without blocking anyone:

```txt
Add basic pytest tests
Add better file validation
Add local storage helper
Add fallback BPM detection
Add simple librosa BPM detection
Add request logging
Add error response helpers
Add Dockerfile for backend
Add .env.example entries
Add seed move library
```

## Avoid for MVP

Do not spend v1 time on:

```txt
EDGE integration
Wav2Lip
GPU inference
MP4 export
TikTok API
User accounts
Database migrations
Complex authentication
```

## Cursor Prompt for Your Role

Paste this into Cursor when working on the backend:

```txt
You are working on the FastAPI backend for a TikTok dance generator MVP. Only edit files inside apps/api. Implement upload, analyze, and generate dance endpoints using the agreed DancePlan API contract. Start with a 120 BPM stub and a JSON move library. Do not edit frontend components or avatar-player files. Keep response shapes stable and typed with Pydantic.
```

## PR Checklist

Before opening a PR:

```txt
GET /api/health works
POST /api/songs/upload returns songId and fileUrl
POST /api/songs/analyze returns bpm, durationSeconds, and beats
POST /api/dances/generate returns valid DancePlan JSON
No frontend component files changed
No avatar package files changed
API response matches contract exactly
```

## First Tasks

Start in this order:

1. Create FastAPI app and health endpoint.
2. Create Pydantic schemas.
3. Add upload endpoint.
4. Add analyze endpoint with 120 BPM stub.
5. Add `move_library.json`.
6. Add dance generator service.
7. Add generate dance endpoint.
8. Add librosa BPM detection after the frontend can hit the endpoints.
