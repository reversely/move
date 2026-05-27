# Team Workflow and Merge Rules

## Project

TikTok Dance Generator MVP

The MVP turns a song into a short dance plan and displays a fake avatar performing prebuilt dance moves.

The v1 system should avoid AI motion generation. Use beat detection plus reusable animation clips.

## Team Roles

| Person | Role | Main Area |
|---|---|---|
| Person 1 | UI Engineer | User flow, layout, upload controls, move list, timeline |
| Person 2 | Backend Engineer | FastAPI, upload, audio analysis, dance generation API |
| Person 3 | Avatar and Animation Engineer | Three.js scene, avatar rendering, animation playback, move timing |

## Main Rule

Each person should mostly work in their own folders. Shared files can be changed only when the person opens a small contract PR or confirms with the other two teammates.

This keeps merge conflicts low and makes Cursor easier to use.

## Suggested Repo Structure

```txt
tiktok-dance-mvp/
  README.md
  .env.example
  package.json
  pnpm-workspace.yaml

  apps/
    web/
      app/
        page.tsx
        layout.tsx
        globals.css
      components/
        upload/
        controls/
        timeline/
        avatar/
        ui/
      lib/
        api.ts
        constants.ts
      types/
        dance.ts
      public/

    api/
      main.py
      requirements.txt
      routes/
        health.py
        songs.py
        dances.py
      services/
        audio_analysis.py
        dance_generator.py
        storage.py
      schemas/
        dance.py
      data/
        move_library.json
      uploads/

  packages/
    avatar-player/
      src/
        AvatarStage.tsx
        Mannequin.tsx
        animationMap.ts
        beatTiming.ts
        types.ts
    dance-core/
      src/
        moveLibrary.ts
        sequence.ts
        types.ts
    contracts/
      dance-plan.schema.json
      api-contract.md

  public/
    avatars/
    animations/
```

## Branch Naming

Use separate branches by role.

```txt
ui/<short-task-name>
backend/<short-task-name>
avatar/<short-task-name>
contract/<short-task-name>
```

Examples:

```txt
ui/upload-screen
backend/generate-dance-endpoint
avatar/play-move-sequence
contract/dance-plan-v1
```

## Shared Contract Files

These files affect everyone and should be edited carefully.

```txt
packages/contracts/dance-plan.schema.json
packages/contracts/api-contract.md
apps/web/types/dance.ts
apps/api/schemas/dance.py
packages/dance-core/src/types.ts
```

## Contract Change Process

Use this process before changing shared data shapes.

1. Open a small PR that only changes the contract files.
2. Include one example request and one example response.
3. Tag the other two teammates.
4. Merge the contract PR first.
5. Each person updates their area after the contract is merged.

## MVP API Contract

### Upload song

```txt
POST /api/songs/upload
```

Response:

```json
{
  "songId": "song_abc123",
  "fileUrl": "/uploads/song_abc123.mp3"
}
```

### Analyze song

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

### Generate dance

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

## Merge Conflict Prevention

### Person 1 should not edit

```txt
apps/api/
packages/avatar-player/
packages/dance-core/
public/avatars/
public/animations/
```

### Person 2 should not edit

```txt
apps/web/components/
packages/avatar-player/
public/avatars/
public/animations/
```

### Person 3 should not edit

```txt
apps/api/routes/
apps/api/services/audio_analysis.py
apps/web/components/upload/
apps/web/components/controls/
```

## Good PR Size

Keep each PR small.

Good PR examples:

```txt
Add SongUploader component
Add upload endpoint
Add beat timing helper
Add MoveList component
Add mannequin placeholder
```

Avoid PRs like:

```txt
Build entire frontend
Refactor all backend
Change all project structure
```

## Daily Integration Checklist

Each teammate should pull main before starting work.

```txt
git checkout main
git pull
git checkout -b ui/upload-screen
```

Before opening a PR:

```txt
git pull origin main
pnpm lint
pnpm typecheck
pytest
```

It is okay if backend tests are not wired on day one. Add basic tests as soon as endpoint shapes stabilize.

## Definition of Done for MVP

The MVP is done when:

1. A user can upload or select an audio file.
2. Backend returns a BPM, even if it falls back to 120 BPM.
3. Backend returns a valid DancePlan JSON.
4. Frontend displays the dance breakdown.
5. Avatar screen renders a fake figure.
6. Avatar plays or simulates the move sequence.
7. The UI shows current move timing.
8. The repo can be run by a new developer from README instructions.
