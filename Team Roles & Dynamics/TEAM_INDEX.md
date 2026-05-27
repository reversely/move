# MVP Team Role Docs

Use these files to split work across three people without stepping on each other.

## Files

```txt
00_TEAM_WORKFLOW.md
01_UI_ENGINEER.md
02_BACKEND_ENGINEER.md
03_AVATAR_ANIMATION_ENGINEER.md
```

## Suggested Ownership

| File | Owner | Purpose |
|---|---|---|
| 00_TEAM_WORKFLOW.md | Everyone | Merge rules, shared contract, branch naming |
| 01_UI_ENGINEER.md | Person 1 | Frontend UI responsibilities |
| 02_BACKEND_ENGINEER.md | Person 2 | Backend and audio API responsibilities |
| 03_AVATAR_ANIMATION_ENGINEER.md | Person 3 | Avatar rendering and animation responsibilities |

## Recommended First Week Plan

### Day 1

```txt
Person 1: Build static UI with mock DancePlan
Person 2: Build FastAPI health endpoint and schemas
Person 3: Build AvatarStage with placeholder mannequin
```

### Day 2

```txt
Person 1: Add upload and generate UI states
Person 2: Add upload, analyze, and generate endpoints
Person 3: Add beat timing and active move logic
```

### Day 3

```txt
Person 1: Wire UI to backend
Person 2: Add move_library.json and deterministic generator
Person 3: Add placeholder motion per move ID
```

### Day 4

```txt
Person 1: Polish layout and timeline
Person 2: Add librosa BPM detection fallback
Person 3: Add animationMap and asset loading fallback
```

### Day 5

```txt
Everyone: Integration testing
Everyone: Fix API mismatches
Everyone: Record demo flow
```

## Best Baseline Demo

The demo should show this flow:

```txt
Upload song
Choose easy and fun
Click Generate Dance
See avatar move through four placeholder dance moves
See move list update with counts
```

## Shared Rule

No one should rewrite the project structure alone. If the structure needs to change, make a separate small PR and get agreement first.
