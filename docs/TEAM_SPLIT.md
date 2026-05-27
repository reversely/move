# Team Split (PRD-Aligned)

## Person 1 - Frontend Product Engineer

Owns:

- `apps/web/app/page.tsx`
- `apps/web/components/AudioUploader.tsx`
- `apps/web/components/StyleSelector.tsx`
- `apps/web/components/ExportButton.tsx`
- UI states and flows

## Person 2 - Audio + AI Backend Engineer

Owns:

- `apps/api/audio_analyzer.py`
- `apps/api/main.py`
- `apps/api/requirements.txt`
- `apps/web/app/api/choreograph/route.ts`
- prompt engineering + model response validation

## Person 3 - Animation Renderer Engineer

Owns:

- `apps/web/components/StickFigureCanvas.tsx`
- keyframe interpolation
- beat-locked playback behavior
- renderer quality/performance
