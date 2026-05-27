# Team Workflow (PRD Reimplementation)

## Architecture Baseline

Core flow:

1. Frontend uploads file to analyzer service (`POST /analyze`)
2. Analyzer returns music features
3. Frontend calls `POST /api/choreograph`
4. Route calls Claude (or fallback generator) and returns keyframe JSON
5. Stick figure canvas renders + syncs to audio
6. Export button records preview and converts to MP4 (WebM fallback)

## Shared API Contracts

### Analyzer response contract

```json
{
  "bpm": 127.8,
  "beat_times": [0.23, 0.7, 1.17],
  "onset_per_beat": [0.4, 1.2, 0.3],
  "percussive_ratio": 0.71,
  "spectral_bands": { "bass": 0.52, "mid": 0.33, "treble": 0.15 },
  "key": "F#",
  "duration_seconds": 187.4
}
```

### Choreography response contract

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

## Branch Strategy

```txt
ui/prd-upload-generate-export
backend/prd-analyzer-claude-route
renderer/prd-stick-figure-sync
```

## Merge Order

1. Contract updates (`docs/API_CONTRACT.md`, `apps/web/lib/types.ts`)
2. Analyzer service updates (`apps/api`)
3. Claude route updates (`apps/web/app/api/choreograph/route.ts`)
4. Renderer changes (`StickFigureCanvas`)
5. UI/export polish

## PR Checklist (All Roles)

- Contract unchanged or explicitly versioned
- Local run passes (`pnpm dev`, analyzer health, choreography route)
- Upload → analyze → generate → preview path works
- No ownership boundary violations

## Daily Integration Smoke Test

1. Upload `.mp3`
2. Check analyzer stats populate in UI
3. Generate choreography twice (variation check)
4. Play/pause preview
5. Export clip
