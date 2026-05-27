# Person 1: UI Engineer

## Mission

Deliver a reliable end-user flow: upload, analyze status, style selection, generate/regenerate, preview controls, export.

## Owned Files

```txt
apps/web/app/page.tsx
apps/web/components/AudioUploader.tsx
apps/web/components/StyleSelector.tsx
apps/web/components/ExportButton.tsx
apps/web/app/globals.css
```

## Responsibilities

- Build loading/error/empty states for each phase
- Keep buttons correctly enabled/disabled by state
- Ensure `audio` controls and canvas playback state stay consistent
- Surface analyzer metrics and generation status clearly
- Keep export UX understandable (MP4 conversion may take time)

## Do Not Touch (Without Team Agreement)

```txt
apps/api/**
apps/web/app/api/choreograph/route.ts
apps/web/components/StickFigureCanvas.tsx
apps/web/lib/types.ts
```

## PR Checklist

- Upload works with `.mp3` and `.wav`
- Analyze errors are readable
- Generate disabled until analysis exists
- Regenerate preserves analysis/style context
- Export button disabled when no canvas/choreography
- No backend files modified
