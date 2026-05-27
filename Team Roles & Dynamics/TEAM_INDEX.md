# PRD Team Index

Use these docs to split work for the AI Dance Generator PRD implementation.

## Files

```txt
TEAM_WORKFLOW.md
01_UI_ENGINEER.md
02_BACKEND_ENGINEER.md
03_AVATAR_ANIMATION_ENGINEER.md
```

## Ownership Summary

| File | Owner | Focus |
|---|---|---|
| `01_UI_ENGINEER.md` | Person 1 | Upload/generate/export UX in Next.js |
| `02_BACKEND_ENGINEER.md` | Person 2 | Audio analyzer + Claude choreography route |
| `03_AVATAR_ANIMATION_ENGINEER.md` | Person 3 | Stick figure renderer + interpolation/sync |
| `TEAM_WORKFLOW.md` | Everyone | Contract, branching, merge order, test gates |

## Shared Rule

No one changes choreography JSON schema or analyzer response fields alone. Contract changes require all three roles to approve in one PR.
