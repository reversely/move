# Person 3: Avatar and Animation Engineer

## Mission

Build the fake figure preview and animation playback system.

Your job is to turn the DancePlan JSON into a visual preview. For v1, this can be a simple mannequin or placeholder body. The goal is to prove that a generated dance can be displayed visually.

## Owned Areas

You own these paths:

```txt
packages/avatar-player/
packages/dance-core/
apps/web/components/avatar/
public/avatars/
public/animations/
```

You may also create helper files inside those folders.

## Do Not Touch

Avoid editing these paths unless the whole team agrees:

```txt
apps/api/routes/
apps/api/services/audio_analysis.py
apps/api/services/dance_generator.py
apps/web/components/upload/
apps/web/components/controls/
apps/web/components/timeline/
```

You can ask Person 1 to adjust layout if the avatar container needs a different size.

## Main Responsibilities

### 1. Avatar preview component

Build:

```txt
apps/web/components/avatar/AvatarStage.tsx
```

It should:

```txt
Render a Three.js canvas
Show a fake mannequin or placeholder avatar
Accept a DancePlan prop
Start, stop, and replay the dance preview
Expose a simple current move callback if needed
```

Expected props:

```ts
export type AvatarStageProps = {
  dancePlan: DancePlan | null;
  bpm?: number;
  isPlaying?: boolean;
  onCurrentMoveChange?: (moveId: string | null) => void;
};
```

### 2. Avatar player package

Build:

```txt
packages/avatar-player/src/
  AvatarStage.tsx
  Mannequin.tsx
  animationMap.ts
  beatTiming.ts
  sequencePlayer.ts
  types.ts
```

Responsibilities:

```txt
Render the avatar scene
Map move IDs to animation names
Calculate timing from BPM
Play moves in sequence
Provide a simple fallback if animation assets are missing
```

### 3. Dance core package

Build:

```txt
packages/dance-core/src/
  types.ts
  beatTiming.ts
  sequence.ts
  moveLibrary.ts
```

Responsibilities:

```txt
Shared timing helpers
Move sequence helpers
DancePlan utility functions
Validation helpers for move timing
```

### 4. Placeholder mannequin

For v1, do not block on a perfect rigged avatar.

Start with a basic fake figure:

```txt
head: sphere
body: capsule or box
arms: cylinders
legs: cylinders
```

Animate simple transforms per move:

```txt
step_touch: sway left and right
clap: arms move inward
point_forward: one arm points forward
shoulder_bounce: body moves up and down
freeze_pose: hold a pose
```

This is enough for a demo before real VRM or GLB clips are ready.

### 5. Animation asset organization

Use:

```txt
public/animations/
  idle.glb
  step_touch.glb
  clap.glb
  point_forward.glb
  shoulder_bounce.glb
  freeze_pose.glb

public/avatars/
  default.vrm
  mannequin.glb
```

If actual assets are not ready, create placeholder files later. Do not commit large random assets without checking with the team.

## Move ID to Animation Mapping

Create:

```txt
packages/avatar-player/src/animationMap.ts
```

```ts
export const animationMap = {
  idle: "/animations/idle.glb",
  step_touch: "/animations/step_touch.glb",
  clap: "/animations/clap.glb",
  point_forward: "/animations/point_forward.glb",
  shoulder_bounce: "/animations/shoulder_bounce.glb",
  freeze_pose: "/animations/freeze_pose.glb"
} as const;
```

## Beat Timing Helper

Create:

```txt
packages/avatar-player/src/beatTiming.ts
```

```ts
export function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
}

export function moveStartSeconds(startBeat: number, bpm: number): number {
  return (startBeat - 1) * secondsPerBeat(bpm);
}

export function moveDurationSeconds(startBeat: number, endBeat: number, bpm: number): number {
  return (endBeat - startBeat + 1) * secondsPerBeat(bpm);
}
```

## Sequence Player Behavior

The sequence player should:

```txt
Take DancePlan and BPM
Calculate start time for each move
At the right time, activate that move
Tell the UI what move is active
Loop or stop at the end based on props
Fall back to idle when no dance exists
```

For v1, it can fake motion with transform changes instead of real animation clips.

## Allowed Extra Work

You can also do these tasks without blocking anyone:

```txt
Add orbit camera controls for debugging
Add play and pause API
Add slow mode
Add animation fallback when assets are missing
Add basic lighting and stage floor
Add current beat display helper
Add VRM loader spike in a separate branch
Add GLB animation loading spike in a separate branch
Add move preview mode for one move at a time
```

## Avoid for MVP

Do not spend v1 time on:

```txt
EDGE integration
Wav2Lip
Retargeting BVH to VRM
Realistic human avatar rendering
Server side MP4 export
Complex IK systems
Perfect foot contact
```

## Cursor Prompt for Your Role

Paste this into Cursor when working on avatar and animation:

```txt
You are working on the avatar and animation system for a TikTok dance generator MVP. Only edit packages/avatar-player, packages/dance-core, apps/web/components/avatar, public/avatars, and public/animations. Build a React Three Fiber avatar preview that accepts a DancePlan and BPM, calculates move timing, and shows a simple mannequin performing placeholder motions. Do not edit backend routes or UI upload/control/timeline components.
```

## PR Checklist

Before opening a PR:

```txt
AvatarStage renders without crashing
It accepts null dancePlan
It accepts valid DancePlan
It shows idle state when no dance exists
It can step through moves based on BPM timing
No backend route files changed
No upload or control UI files changed
Missing animation assets do not crash the app
```

## First Tasks

Start in this order:

1. Create `AvatarStage.tsx` with a basic canvas.
2. Create `Mannequin.tsx` with simple geometry.
3. Add `beatTiming.ts` helpers.
4. Accept a mock DancePlan and calculate active move.
5. Add placeholder motion per move ID.
6. Add animation map for future GLB clips.
7. Add VRM loader only after the placeholder mannequin works.
