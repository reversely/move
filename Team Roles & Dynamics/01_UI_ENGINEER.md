# Person 1: UI Engineer

## Mission

Build the user facing web app for the MVP.

Your job is to make the product feel real even while the backend and avatar system are still simple. The user should be able to upload a song, select options, generate a dance, and read the dance breakdown.

## Owned Areas

You own these paths:

```txt
apps/web/app/
apps/web/components/upload/
apps/web/components/controls/
apps/web/components/timeline/
apps/web/components/ui/
apps/web/lib/api.ts
apps/web/lib/constants.ts
apps/web/types/dance.ts
```

You may also create new files inside those folders.

## Do Not Touch

Avoid editing these paths unless the whole team agrees:

```txt
apps/api/
packages/avatar-player/
packages/dance-core/
public/avatars/
public/animations/
packages/contracts/
```

You can import from `packages/avatar-player`, but do not change it unless Person 3 asks you to.

## Main Responsibilities

### 1. Main app page

Build the core page in:

```txt
apps/web/app/page.tsx
```

The page should include:

```txt
Song upload section
Style selector
Difficulty selector
Generate button
Avatar preview section
Dance breakdown section
Timeline section
Loading and error states
```

### 2. Upload flow

Build:

```txt
apps/web/components/upload/SongUploader.tsx
```

Responsibilities:

```txt
Accept audio file input
Call POST /api/songs/upload
Store returned songId
Show selected file name
Show upload loading state
Show upload error state
```

Expected props:

```ts
export type SongUploaderProps = {
  onUploaded: (song: { songId: string; fileUrl: string }) => void;
};
```

### 3. Dance controls

Build:

```txt
apps/web/components/controls/DanceControls.tsx
```

Controls:

```txt
Style: fun, cool, cute, high_energy
Difficulty: easy, medium
Total beats: 8, 16
```

Expected props:

```ts
export type DanceControlsProps = {
  style: string;
  difficulty: string;
  totalBeats: number;
  onStyleChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onTotalBeatsChange: (value: number) => void;
};
```

### 4. API client

Build:

```txt
apps/web/lib/api.ts
```

Functions:

```ts
uploadSong(file: File): Promise<UploadSongResponse>
analyzeSong(songId: string): Promise<AnalyzeSongResponse>
generateDance(input: GenerateDanceInput): Promise<GenerateDanceResponse>
```

This file is your boundary with the backend. Keep all fetch logic here so components stay clean.

### 5. Dance breakdown

Build:

```txt
apps/web/components/timeline/MoveList.tsx
apps/web/components/timeline/DanceTimeline.tsx
```

MoveList should show:

```txt
Counts 1 to 2: Step right, then left
Counts 3 to 4: Clap twice
Counts 5 to 6: Point to camera
Counts 7 to 8: Freeze pose
```

DanceTimeline should show:

```txt
Move blocks in order
Current active move
Beat count labels
```

For v1, it can be simple cards. It does not need a complex waveform.

## Allowed Extra Work

You can also do these tasks without blocking anyone:

```txt
Add empty states
Add error banners
Add loading spinners
Add responsive layout
Add nice cards and buttons
Add mobile friendly layout
Add demo mode with hardcoded DancePlan
Add copy dance steps button
Add regenerate button UI only
Add mock data file for local development
```

## Mock Data You Can Use

Create this if backend is not ready:

```txt
apps/web/lib/mockDancePlan.ts
```

```ts
export const mockDancePlan = {
  songId: "mock_song",
  bpm: 120,
  dance: {
    id: "mock_dance",
    style: "fun",
    difficulty: "easy",
    totalBeats: 8,
    moves: [
      {
        startBeat: 1,
        endBeat: 2,
        moveId: "step_touch",
        label: "Step right, then left",
        animationClip: "step_touch.glb"
      },
      {
        startBeat: 3,
        endBeat: 4,
        moveId: "clap",
        label: "Clap twice on the beat",
        animationClip: "clap.glb"
      },
      {
        startBeat: 5,
        endBeat: 6,
        moveId: "point_forward",
        label: "Point to the camera",
        animationClip: "point_forward.glb"
      },
      {
        startBeat: 7,
        endBeat: 8,
        moveId: "freeze_pose",
        label: "Hold a final pose",
        animationClip: "freeze_pose.glb"
      }
    ]
  }
};
```

## UI Layout Suggestion

```txt
 -------------------------------------------------
| Upload song                                      |
| Style selector | Difficulty selector | Generate  |
 -------------------------------------------------
|                     Avatar Preview              |
|                                                  |
|                     Fake Figure                  |
|                                                  |
 -------------------------------------------------
| Timeline                                         |
| [1-2 Step Touch] [3-4 Clap] [5-6 Point] [7-8 Pose]|
 -------------------------------------------------
| Move breakdown                                   |
| Counts 1 to 2: Step right, then left             |
| Counts 3 to 4: Clap twice                        |
 -------------------------------------------------
```

## Cursor Prompt for Your Role

Paste this into Cursor when working on the UI:

```txt
You are working on the frontend UI for a TikTok dance generator MVP. Only edit files inside apps/web/app, apps/web/components/upload, apps/web/components/controls, apps/web/components/timeline, apps/web/components/ui, and apps/web/lib/api.ts. Build a clean Next.js TypeScript UI with upload, dance controls, generate button, avatar preview container, move list, and timeline. Use the DancePlan API contract exactly. Do not edit backend or avatar-player files.
```

## PR Checklist

Before opening a PR:

```txt
Page renders without crashing
Upload component handles empty file state
Generate button disables while loading
Move list works with mock DancePlan
No backend files changed
No avatar package files changed
Types are exported cleanly
```

## First Tasks

Start in this order:

1. Create the main page layout.
2. Create `DanceControls.tsx`.
3. Create `MoveList.tsx`.
4. Create `api.ts` with backend calls.
5. Add mock mode so the UI works before backend is done.
6. Wire the real backend once Person 2 finishes endpoints.
7. Drop in Person 3's `AvatarStage` component.
