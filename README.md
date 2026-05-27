# TikTok Dance Generator MVP

Monorepo skeleton for a TikTok-style dance preview app.

## Apps

- `apps/web`: Next.js frontend for upload, controls, avatar stage, and dance move list
- `apps/api`: FastAPI backend for song upload, song analysis, and dance plan generation

## Packages

- `packages/shared`: shared API/dance types
- `packages/dance-core`: timing helpers and dance utilities
- `packages/avatar-player`: avatar player scaffolding

## Quick Start

1. Install JS dependencies:
   - `pnpm install`
2. Create Python venv and install API deps:
   - `cd apps/api`
   - `python -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -r requirements.txt`
3. Run both apps:
   - `pnpm dev`
