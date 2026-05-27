# System Architecture — AI Dance Generator

Architecture diagrams for the v1 product described in [prd.md](../prd.md). Use these in slides, README, or any Mermaid-capable viewer (GitHub, Notion, Obsidian, etc.).

---

## 1. High-level context

Who talks to what, and where compute runs.

```mermaid
flowchart TB
    subgraph User["Artist / social manager"]
        U[Browser]
    end

    subgraph Client["Client (browser)"]
        UI[Next.js UI<br/>upload · style · preview · export]
        Canvas[Canvas 2D renderer<br/>12-joint stick figure · 60fps]
        Export[Export pipeline<br/>MediaRecorder · ffmpeg.wasm]
    end

    subgraph NextServer["Next.js server"]
        ChoreoRoute["/api/choreograph<br/>Claude proxy"]
    end

    subgraph AudioSvc["Audio microservice"]
        Librosa["FastAPI + librosa<br/>POST /analyze"]
    end

    subgraph External["External APIs"]
        Claude["Anthropic Claude<br/>claude-sonnet-4-6"]
    end

    U --> UI
    UI --> Canvas
    UI --> Export
    Canvas --> Export

    UI -->|"multipart audio"| Librosa
    Librosa -->|"BPM · beats · spectral · key"| UI

    UI -->|"features + style"| ChoreoRoute
    ChoreoRoute -->|"choreography JSON"| UI
    ChoreoRoute <-->|"generate phrases"| Claude

    Export -->|"MP4 1080×1920"| U
```

---

## 2. End-to-end data flow

From upload to TikTok-ready export.

```mermaid
sequenceDiagram
    autonumber
    actor Artist
    participant UI as Next.js UI
    participant Analyze as librosa service<br/>POST /analyze
    participant API as /api/choreograph
    participant Claude as Claude API
    participant Canvas as Stick figure canvas
    participant Rec as MediaRecorder + ffmpeg.wasm

    Artist->>UI: Upload MP3/WAV
    UI->>Analyze: Audio file (multipart)
    Analyze-->>UI: bpm, beat_times, onset_per_beat,<br/>percussive_ratio, spectral_bands, key

    Artist->>UI: Select style (Hype / Smooth / Quirky)
    UI->>API: Audio features + style + phrase_count
    API->>Claude: System prompt (cached) + user prompt
    Claude-->>API: phrases[] with joint keyframes
    API-->>UI: Choreography JSON

    UI->>Canvas: Keyframes + beat grid + BPM
    Canvas->>Canvas: Interpolate joints @ 60fps,<br/>sync playback to detected BPM
    Artist->>UI: Preview (optional Regenerate → repeat 5–7)

    Artist->>UI: Export
    UI->>Rec: canvas.captureStream(30)
    Rec-->>Artist: MP4 1080×1920 vertical
```

---

## 3. Frontend component map

Next.js App Router layout from the PRD.

```mermaid
flowchart LR
    subgraph App["apps/web — Next.js App Router"]
        Page["/page.tsx<br/>upload + main flow"]

        subgraph Components["/components"]
            Upload[AudioUploader]
            Style[StyleSelector<br/>Hype · Smooth · Quirky]
            Canvas[StickFigureCanvas<br/>Canvas 2D · 12 joints]
            ExportBtn[ExportButton]
        end

        subgraph API["/app/api"]
            Choreo["choreograph/route.ts<br/>Claude + schema validation"]
        end
    end

    Page --> Upload
    Page --> Style
    Page --> Canvas
    Page --> ExportBtn

    Upload -->|"POST /analyze"| LibrosaSvc[(librosa service)]
    Page -->|"features + style"| Choreo
    Choreo --> ClaudeAPI[(Claude API)]

    Canvas -->|"keyframes + audio"| Page
    ExportBtn -->|"captureStream"| Canvas
```

---

## 4. Choreography pipeline (AI + audio signals)

How analyzed audio shapes what Claude generates.

```mermaid
flowchart TD
    subgraph Input["Inputs to choreography"]
        File[Audio file]
        Style["style: hype · smooth · quirky"]
    end

    subgraph LibrosaOut["POST /analyze response"]
        BPM[bpm]
        Beats[beat_times]
        Onset[onset_per_beat]
        Perc[percussive_ratio]
        Spec["spectral_bands<br/>bass · mid · treble"]
        Key[key]
    end

    subgraph Prompt["Claude user prompt context"]
        P1["Tempo and key mood"]
        P2["Beat strength — hits vs flows"]
        P3["Percussive — staccato vs smooth"]
        P4["Bass — hip and low body"]
        P5["Treble — wrist detail"]
        P6["8-count phrase arc<br/>groove — develop — peak"]
    end

    subgraph Output["Choreography JSON"]
        Phrases["phrases array"]
        KF["keyframes per phrase<br/>13 joints · normalized coords"]
    end

    Claude["Claude API<br/>cached system prompt"]
    Renderer[Canvas renderer]

    File --> LibrosaOut
    Style --> Prompt
    BPM --> P1
    Key --> P1
    Beats --> P2
    Onset --> P2
    Perc --> P3
    Spec --> P4
    Spec --> P5
    Style --> P6

    P1 --> Claude
    P2 --> Claude
    P3 --> Claude
    P4 --> Claude
    P5 --> Claude
    P6 --> Claude
    Claude --> Phrases
    Phrases --> KF
    KF --> Renderer
    BPM --> Renderer
    Beats --> Renderer
```

---

## 5. Rendering & export (in-browser)

All preview and export stay on the client; no server-side video encoding in v1.

```mermaid
flowchart TB
    subgraph Playback["Preview loop"]
        Audio[HTMLAudioElement<br/>tempo locked to BPM]
        Clock[Beat clock from beat_times]
        Interp[Linear joint interpolation<br/>between keyframes @ 60fps]
        Draw[Canvas 2D draw<br/>70% canvas height · dark bg]
    end

    subgraph Export["Export (v1)"]
        Stream["canvas.captureStream(30)"]
        MR[MediaRecorder VP9/WebM]
        FF[ffmpeg.wasm → MP4]
        Out["1080×1920 · 30fps · &lt;50MB"]
    end

    ChoreoJSON[(Choreography JSON)] --> Interp
    AnalyzeJSON[(Analyze JSON)] --> Clock
    AnalyzeJSON --> Audio

    Interp --> Draw
    Clock --> Interp
    Audio --> Draw

    Draw --> Stream
    Stream --> MR
    MR --> FF
    FF --> Out
```

---

## 6. Deployment topology (v1 → production)

```mermaid
flowchart TB
    subgraph Dev["Development"]
        NextDev[Next.js :3000]
        Uvicorn[uvicorn audio_analyzer :8000]
        NextDev <-->|localhost| Uvicorn
    end

    subgraph Prod["Production (target)"]
        Vercel[Vercel — Next.js + /api/choreograph]
        Modal["Modal or Fly.io<br/>librosa FastAPI"]
        Anthropic[Anthropic API]
    end

    Browser[User browser] --> Vercel
    Browser --> Modal
    Vercel --> Anthropic

    Dev -.->|migrate| Prod
```

---

## 7. v2 scope (reference only)

Out of MVP but shown for roadmap context on slides.

```mermaid
mindmap
  root((v2))
    Avatar
      Colors
      Accessories
    Editing
      Clip trim
      Branding overlay
    Platform
      Save library
      Share links
      Batch 3 variations
```

---

## Legend

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| UI | Next.js App Router | Upload, style, preview, regenerate, export trigger |
| Audio | FastAPI + librosa | Feature extraction (`POST /analyze`) |
| AI | Claude `claude-sonnet-4-6` | 8-count phrase keyframes (JSON) |
| Render | Canvas 2D | Stick figure playback synced to beats |
| Export | MediaRecorder + ffmpeg.wasm | Vertical MP4 for TikTok |

**Explicitly out of v1:** 3D avatars, motion capture, reference videos, native mobile, social platform posting APIs.
