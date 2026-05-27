# MVP Scope (Current PRD)

## Included

- Audio upload (`.mp3` / `.wav`)
- Python audio analysis microservice (`/analyze`) returning:
  - bpm
  - beat times
  - onset per beat
  - percussive ratio
  - spectral bands
  - key
  - duration
- Claude choreography generation via `app/api/choreograph`
- 2D stick figure renderer (13 joints)
- Keyframe interpolation and beat-synced playback
- Style selector (`hype`, `smooth`, `quirky`)
- Regenerate variation
- Export flow with MP4 conversion attempt and WebM fallback

## Explicitly Out of Scope

- 3D avatars / VRM / realistic humans
- TikTok posting API integration
- Reference video ingestion
- Native mobile app
- Multi-user account system
