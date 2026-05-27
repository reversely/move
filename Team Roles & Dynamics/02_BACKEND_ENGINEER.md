# Person 2: Backend Engineer (Audio + AI)

## Mission

Provide robust feature extraction from audio and stable choreography generation from Claude with safe fallback behavior.

## Owned Files

```txt
apps/api/audio_analyzer.py
apps/api/main.py
apps/api/requirements.txt
apps/web/app/api/choreograph/route.ts
docs/API_CONTRACT.md
```

## Responsibilities

### 1) Audio analyzer microservice

- Run FastAPI analyzer on port `8000`
- Maintain `POST /analyze` multipart contract
- Return: bpm, beat times, onset_per_beat, percussive_ratio, spectral bands, key, duration
- Keep failure handling predictable and debuggable

### 2) Claude choreography route

- Accept analysis/style/phraseCount payload
- Build prompt using PRD signals
- Validate response shape before returning
- Fall back to deterministic generator if Claude response is invalid or unavailable

### 3) Cost and reliability controls

- Keep prompt concise and schema strict
- Bound phrase counts and output size
- Surface provider errors cleanly

## Do Not Touch (Without Team Agreement)

```txt
apps/web/components/AudioUploader.tsx
apps/web/components/StyleSelector.tsx
apps/web/components/ExportButton.tsx
apps/web/components/StickFigureCanvas.tsx
```

## PR Checklist

- `GET /health` returns `{ "ok": true }`
- `POST /analyze` accepts real audio and returns full contract
- `POST /api/choreograph` returns valid phrases/keyframes
- Missing `ANTHROPIC_API_KEY` still generates via fallback
- CORS supports local frontend ports
