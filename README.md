# AI Dance Generator (PRD Reimplementation)

This repo implements the PRD flow:

1. Upload song (MP3/WAV)
2. Analyze audio features via Python FastAPI microservice
3. Generate choreography JSON via Claude API route
4. Render 2D stick figure choreography synced to audio
5. Export TikTok-oriented video (MP4 conversion with WebM fallback)

## Tech Stack

- `apps/web`: Next.js App Router + Canvas 2D renderer + export tooling
- `apps/api`: FastAPI + librosa audio analyzer microservice
- Claude integration: `apps/web/app/api/choreograph/route.ts`

## Environment

Copy `.env.example` and set:

- `NEXT_PUBLIC_ANALYZER_URL` (default local analyzer URL)
- `ANTHROPIC_API_KEY` (optional for real Claude generations; fallback generator is built in)

## Local Setup

1) Install JS deps:

```bash
pnpm install
```

2) Create Python env + install analyzer deps:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

3) Start both services:

```bash
pnpm dev
```

4) Open frontend:

- `http://localhost:3000`

## Key Endpoints

- Analyzer health: `GET http://127.0.0.1:8000/health`
- Analyzer analyze: `POST http://127.0.0.1:8000/analyze` (multipart `file`)
- Choreography: `POST /api/choreograph` (Next.js route)
