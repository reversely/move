# Person 3: Avatar / Animation Engineer

## Mission

Render expressive, smooth, beat-aligned stick-figure choreography from keyframe JSON with high visual clarity on a TikTok vertical canvas.

## Owned Files

```txt
apps/web/components/StickFigureCanvas.tsx
apps/web/lib/types.ts (joint schema coordination only)
```

## Responsibilities

- Implement 13-joint skeleton rendering
- Interpolate keyframes smoothly at runtime
- Handle loop timing and phrase transitions
- Sync rendering to current audio time
- Keep visual output readable at 1080x1920

## Rendering Standards

- Dark background, high-contrast joints/limbs
- Stable center framing and floor reference
- No jitter when audio is paused/resumed
- Safe fallback pose when choreography is null/invalid

## Do Not Touch (Without Team Agreement)

```txt
apps/api/**
apps/web/components/AudioUploader.tsx
apps/web/components/StyleSelector.tsx
apps/web/components/ExportButton.tsx
apps/web/app/api/choreograph/route.ts
```

## PR Checklist

- Canvas renders with no choreography
- Canvas renders valid choreography phrases
- Looping stays in sync for multi-phrase dances
- 30fps+ locally in preview
- No analyzer or prompt-route behavior changed
