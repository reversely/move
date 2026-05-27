# PRD: AI Dance Generator for Artist Promotion

## Overview

A web app that takes an artist's song and generates original, AI-choreographed stick figure dance videos optimized for TikTok. The product removes the barrier between music release and social content creation — artists get shareable promotional content in under a minute, no choreographer or video crew required.

---

## Problem

Artists releasing new music need short-form video content to drive TikTok discovery, but producing dance content requires choreographers, videographers, and post-production. Fan-generated dance trends are organic but unpredictable and slow to emerge. There is no tool that instantly generates original, music-synced dance content from a song file alone.

---

## Target Users

**Primary:** Independent artists and small-label A&R teams releasing singles  
**Secondary:** Social media managers running artist accounts  
**Out of scope for v1:** Labels with in-house production, live performers

---

## Core User Flow

```
1. Upload song (MP3/WAV)
2. App analyzes audio (BPM, energy, genre)
3. Claude API generates original choreography (JSON keyframes)
4. Stick figure avatar renders dance synced to song in-browser
5. User previews and optionally regenerates
6. Export as MP4 ready for TikTok upload
```

---

## Features

### MVP (v1)

| Feature | Description |
|---------|-------------|
| Audio upload | MP3/WAV up to 10min |
| Audio analysis | librosa microservice: BPM, beat grid, onset strength, spectral bands, key, percussive ratio |
| AI choreography | Claude API generates 8-count phrase sequences as joint keyframe JSON |
| Stick figure renderer | Canvas 2D, 12-joint skeleton, smooth interpolation between keyframes |
| Beat sync | Playback tempo locked to detected BPM, phrases aligned to downbeats |
| Regenerate | Re-prompt Claude for a new choreography variation |
| MP4 export | In-browser via MediaRecorder, 1080x1920 (TikTok vertical) |
| Style selector | 3 options passed to Claude prompt: Hype, Smooth, Quirky |

### v2 (Post-MVP)

- Multiple avatar options (color, accessory customization)
- Clip trimming — select which section of the song to use
- Artist branding overlay (logo, song title, handle)
- Save/library — store past generations per artist account
- Share link — hosted preview without downloading
- Batch generation — 3 variations generated simultaneously

### Out of Scope

- 3D avatars or realistic human rendering
- Real-time motion capture input
- User-uploaded reference dance videos
- Mobile native app
- Any social platform API integration (posting is manual)

---

## Technical Architecture

### Frontend (Next.js App Router)

```
/app
  /page.tsx          — upload + main UI
  /api/choreograph   — Claude API route
  /components
    AudioUploader
    StickFigureCanvas
    StyleSelector
    ExportButton
```

### Audio Pipeline (Python microservice — `audio_analyzer.py`)

Runs as a local FastAPI service (`uvicorn audio_analyzer:app --port 8000`) during development; deploy to Modal or Fly.io for production.

**Dependencies:** `fastapi`, `uvicorn`, `librosa`, `python-multipart`

**Endpoint:** `POST /analyze` — accepts multipart audio file, returns:

```json
{
  "bpm": 127.8,
  "beat_times": [0.23, 0.70, 1.17, "...up to 64 beats"],
  "onset_per_beat": [0.4, 1.2, 0.3, 1.8, "...parallel to beat_times"],
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

**What each feature drives in choreography:**

| Feature | Choreography signal |
|---------|-------------------|
| `bpm` | Phrase tempo and keyframe density |
| `beat_times` | Exact sync points for keyframe placement |
| `onset_per_beat` | Beat strength — spikes → sharp hits, valleys → flows |
| `percussive_ratio` | High → staccato/popping style; low → smooth/wavy |
| `spectral_bands.bass` | High → hip/low-body emphasis |
| `spectral_bands.treble` | High → finger/wrist detail movement |
| `key` | Passed to Claude as mood context |

### AI Choreography (Claude API)

**Input to Claude:**
```json
{
  "bpm": 127.8,
  "key": "F#",
  "style": "hype",
  "percussive_ratio": 0.71,
  "spectral_bands": { "bass": 0.52, "mid": 0.33, "treble": 0.15 },
  "onset_per_beat": [0.4, 1.2, 0.3, 1.8, 0.5, 1.1, 0.6, 1.9],
  "phrase_count": 8
}
```

**Output schema (Claude returns):**
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
            "head": { "x": 0, "y": 0 },
            "shoulder_l": { "x": -0.3, "y": 0.2 },
            "shoulder_r": { "x": 0.3, "y": 0.2 },
            "elbow_l": { "x": -0.5, "y": 0.4 },
            "elbow_r": { "x": 0.5, "y": 0.1 },
            "wrist_l": { "x": -0.6, "y": 0.6 },
            "wrist_r": { "x": 0.7, "y": 0.0 },
            "hip_l": { "x": -0.15, "y": 0.8 },
            "hip_r": { "x": 0.15, "y": 0.8 },
            "knee_l": { "x": -0.2, "y": 1.2 },
            "knee_r": { "x": 0.2, "y": 1.2 },
            "ankle_l": { "x": -0.2, "y": 1.7 },
            "ankle_r": { "x": 0.2, "y": 1.7 }
          }
        }
      ]
    }
  ]
}
```

**Claude model:** `claude-sonnet-4-6` with prompt caching on the system prompt (joint schema + style definitions are static — cache saves ~80% of token cost on regenerations)

### Rendering (Canvas 2D)

- Normalize joint coordinates to canvas dimensions
- Linear interpolation between keyframes at 60fps
- Joints scaled so full figure height = 70% of canvas height
- Background: solid dark color for TikTok contrast

### Export

- `canvas.captureStream(30)` → `MediaRecorder` (VP9/WebM) → convert to MP4 via `ffmpeg.wasm` client-side
- Target: 1080x1920, 30fps, <50MB

---

## Claude Prompt Design

### System Prompt (cacheable)

```
You are a choreography engine. Generate dance move sequences for a stick figure avatar.
The stick figure has 13 joints. Coordinates are normalized: center body = (0,0), 
full height span = 2.0 units. Return only valid JSON matching the provided schema.
Movements should feel rhythmic, expressive, and loop cleanly across 8-count phrases.

Style definitions:
- hype: large arm movements, weight shifts, high energy, hits on every beat
- smooth: fluid transitions, minimal holds, wave-like arm motion, hip sways
- quirky: unexpected directional changes, asymmetric poses, pauses between beats
```

### User Prompt (per generation)

```
Generate choreography for a song in the key of {key}.
BPM: {bpm}. Style: {style}.

Audio characteristics:
- Percussive intensity: {percussive_ratio}/1.0 — {"sharp, hitting movements" if > 0.6 else "smooth, flowing movements"}
- Bass dominance: {spectral_bands.bass} — {"emphasize hip and low-body movement" if > 0.45 else ""}
- Treble presence: {spectral_bands.treble} — {"add wrist and finger detail" if > 0.2 else ""}
- Beat strength per beat (0=soft, 2=hard hit): {onset_per_beat}
  Use high-onset beats for arm pops or weight shifts; low-onset beats for holds or transitions.

Create {phrase_count} 8-count phrases that build in energy across the sequence.
Phrases 1-2: establish the groove. Phrases 3-6: develop. Phrases 7-8: peak energy.
```

---

## Success Metrics (v1)

| Metric | Target |
|--------|--------|
| Time from upload to preview | < 30 seconds |
| Time from upload to exported MP4 | < 90 seconds |
| Regeneration accepted rate | > 40% (user keeps first generation) |
| Export completion rate | > 60% of sessions that reach preview |
| Claude API cost per export | < $0.05 |

---

## Open Questions

1. **Looping strategy** — does the dance loop for the full song duration, or generate unique phrases throughout? (Looping is simpler; unique is more impressive)
2. **BPM half-time/double-time** — slow songs may need half-time choreography to avoid robotic movement; fast songs may need double-time. Rule-based threshold or pass to Claude?
3. **Intro/outro handling** — most songs have 4-8 bars of non-beat intro. Hold a neutral pose or animate more subtly?
4. **Phrase transitions** — interpolate smoothly between phrases or snap to create a "hit" effect on the 1?
5. **Cost control** — cap generations per session without auth? Rate limit by IP for v1?

---

## Build Order

### Hour 1 — Core Loop
- [ ] librosa FastAPI service + `/analyze` endpoint running locally
- [ ] Next.js project setup
- [ ] Audio upload → POST to librosa service → features JSON
- [ ] Claude API route with enriched prompt + JSON schema
- [ ] Stick figure Canvas renderer (static pose first)
- [ ] Keyframe playback synced to audio

### Hour 2 — Polish + Export
- [ ] Smooth keyframe interpolation
- [ ] Style selector (3 options)
- [ ] Regenerate button
- [ ] MediaRecorder MP4 export
- [ ] Basic UI (upload state, loading, preview)

### Week 2 — v2 Features
- [ ] Prompt caching on Claude system prompt
- [ ] Deploy librosa service to Modal or Fly.io
- [ ] Multiple avatar styles
- [ ] Branding overlay
- [ ] Hosted share links
