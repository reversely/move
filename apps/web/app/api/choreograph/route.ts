import { NextResponse } from "next/server";

import type { AudioAnalysis, Choreography, DanceStyle, JointName, JointPoint } from "@/lib/types";

const JOINT_NAMES: JointName[] = [
  "head",
  "shoulder_l",
  "shoulder_r",
  "elbow_l",
  "elbow_r",
  "wrist_l",
  "wrist_r",
  "hip_l",
  "hip_r",
  "knee_l",
  "knee_r",
  "ankle_l",
  "ankle_r",
];

const BASE_POSE: Record<JointName, JointPoint> = {
  head: { x: 0, y: 0 },
  shoulder_l: { x: -0.3, y: 0.2 },
  shoulder_r: { x: 0.3, y: 0.2 },
  elbow_l: { x: -0.45, y: 0.45 },
  elbow_r: { x: 0.45, y: 0.45 },
  wrist_l: { x: -0.5, y: 0.7 },
  wrist_r: { x: 0.5, y: 0.7 },
  hip_l: { x: -0.16, y: 0.82 },
  hip_r: { x: 0.16, y: 0.82 },
  knee_l: { x: -0.18, y: 1.25 },
  knee_r: { x: 0.18, y: 1.25 },
  ankle_l: { x: -0.2, y: 1.72 },
  ankle_r: { x: 0.2, y: 1.72 },
};

type ChoreographRequest = {
  analysis: AudioAnalysis;
  style: DanceStyle;
  phraseCount: number;
};

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildFallback(analysis: AudioAnalysis, style: DanceStyle, phraseCount: number): Choreography {
  const ampBase = style === "hype" ? 0.26 : style === "quirky" ? 0.22 : 0.14;
  const phrases = Array.from({ length: phraseCount }, (_, idx) => {
    const beat = idx * 8 + 1;
    const onsets = Array.from({ length: 8 }, (_, beatIdx) => {
      const source = analysis.onset_per_beat.length ? analysis.onset_per_beat[(idx * 8 + beatIdx) % analysis.onset_per_beat.length] : 0.7;
      return source;
    });
    const intensity = onsets.length ? Math.max(...onsets, 0.7) / 2 : 0.7;
    const amp = ampBase + intensity * 0.12;
    return {
      beat,
      duration_beats: 8,
      keyframes: [0, 2, 4, 6, 8].map((offset, frameIndex) => {
        const dir = frameIndex % 2 === 0 ? 1 : -1;
        const hips = analysis.spectral_bands.bass > 0.45 ? 0.07 : 0.04;
        const wrists = analysis.spectral_bands.treble > 0.2 ? 0.09 : 0.05;
        const pose: Record<JointName, JointPoint> = { ...BASE_POSE };
        pose.shoulder_l = { x: BASE_POSE.shoulder_l.x - amp * dir, y: BASE_POSE.shoulder_l.y };
        pose.shoulder_r = { x: BASE_POSE.shoulder_r.x - amp * dir, y: BASE_POSE.shoulder_r.y };
        pose.wrist_l = { x: BASE_POSE.wrist_l.x - (amp + wrists) * dir, y: BASE_POSE.wrist_l.y - 0.07 * dir };
        pose.wrist_r = { x: BASE_POSE.wrist_r.x - (amp + wrists) * dir, y: BASE_POSE.wrist_r.y + 0.07 * dir };
        pose.hip_l = { x: BASE_POSE.hip_l.x + hips * dir, y: BASE_POSE.hip_l.y + 0.03 * dir };
        pose.hip_r = { x: BASE_POSE.hip_r.x + hips * dir, y: BASE_POSE.hip_r.y - 0.03 * dir };
        return { frame_offset: offset, joints: pose };
      }),
    };
  });
  return { phrases };
}

function validateChoreography(value: unknown): value is Choreography {
  if (!value || typeof value !== "object") return false;
  const phrases = (value as { phrases?: unknown }).phrases;
  if (!Array.isArray(phrases)) return false;
  return phrases.every((phrase) => {
    if (!phrase || typeof phrase !== "object") return false;
    const p = phrase as { beat?: unknown; duration_beats?: unknown; keyframes?: unknown };
    if (typeof p.beat !== "number" || typeof p.duration_beats !== "number" || !Array.isArray(p.keyframes)) return false;
    return p.keyframes.every((k) => {
      if (!k || typeof k !== "object") return false;
      const frame = k as { frame_offset?: unknown; joints?: unknown };
      if (typeof frame.frame_offset !== "number" || !frame.joints || typeof frame.joints !== "object") return false;
      return JOINT_NAMES.every((name) => {
        const point = (frame.joints as Record<string, unknown>)[name] as { x?: unknown; y?: unknown } | undefined;
        return point && typeof point.x === "number" && typeof point.y === "number";
      });
    });
  });
}

function buildUserPrompt(input: ChoreographRequest) {
  const { analysis, style, phraseCount } = input;
  const sharp = analysis.percussive_ratio > 0.6 ? "sharp, hitting movements" : "smooth, flowing movements";
  const bassHint = analysis.spectral_bands.bass > 0.45 ? "emphasize hip and low-body movement" : "";
  const trebleHint = analysis.spectral_bands.treble > 0.2 ? "add wrist and finger detail" : "";
  return `
Generate choreography for a song in the key of ${analysis.key}.
BPM: ${analysis.bpm}. Style: ${style}.

Audio characteristics:
- Percussive intensity: ${analysis.percussive_ratio}/1.0 - ${sharp}
- Bass dominance: ${analysis.spectral_bands.bass} - ${bassHint}
- Treble presence: ${analysis.spectral_bands.treble} - ${trebleHint}
- Beat strength per beat (0=soft, 2=hard hit): ${JSON.stringify(analysis.onset_per_beat.slice(0, 64))}
  Use high-onset beats for arm pops or weight shifts; low-onset beats for holds or transitions.

Create ${phraseCount} 8-count phrases that build in energy across the sequence.
Phrases 1-2: establish the groove. Phrases 3-6: develop. Phrases 7-8: peak energy.

Return only JSON in this exact schema:
{
  "phrases": [{ "beat": number, "duration_beats": number, "keyframes": [{ "frame_offset": number, "joints": { ...13 joints... } }] }]
}
`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChoreographRequest;
  if (!body?.analysis || !body?.style) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const phraseCount = Math.min(Math.max(body.phraseCount || 8, 1), 12);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(buildFallback(body.analysis, body.style, phraseCount));
  }

  const systemPrompt = `You are a choreography engine. Generate dance move sequences for a stick figure avatar.
The stick figure has 13 joints. Coordinates are normalized: center body = (0,0),
full height span = 2.0 units. Return only valid JSON matching the provided schema.
Movements should feel rhythmic, expressive, and loop cleanly across 8-count phrases.

Style definitions:
- hype: large arm movements, weight shifts, high energy, hits on every beat
- smooth: fluid transitions, minimal holds, wave-like arm motion, hip sways
- quirky: unexpected directional changes, asymmetric poses, pauses between beats`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: buildUserPrompt({ ...body, phraseCount }) }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: `Claude API failed: ${detail}` }, { status: 502 });
    }

    const payload = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = payload.content?.find((part) => part.type === "text")?.text ?? "";
    const parsed = safeJsonParse<unknown>(text);
    if (!parsed || !validateChoreography(parsed)) {
      return NextResponse.json(buildFallback(body.analysis, body.style, phraseCount));
    }
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(buildFallback(body.analysis, body.style, phraseCount));
  }
}
