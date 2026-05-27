import { NextResponse } from "next/server";

import { callClaude, safeJsonParse } from "@/lib/claudeClient";
import {
  buildChoreographyFromPlanPrompt,
  buildDanceAnalysisPrompt,
  buildLocalDancePlan,
  parseDancePlan,
  type DancePlan,
} from "@/lib/dancePlan";
import { applyMoveIntensity, movesForPhrase, stageForMove } from "@/lib/moveLibrary";
import { clampStagePhysics } from "@/lib/dancePhysics";
import { normalizeStage, stageForPhraseFrame } from "@/lib/stageMotion";
import { pickSequence, sequenceSummaryForPrompt } from "@/lib/tiktokMoves";
import { catalogSummaryForStyle } from "@/lib/tiktokCatalog";
import type { AudioAnalysis, Choreography, DanceStyle, JointName } from "@/lib/types";

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

const FRAME_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const DANCE_ANALYSIS_SYSTEM = `You are an expert TikTok choreographer who knows viral dances: Renegade, Say So, Savage, Blinding Lights, Lottery, About Damn Time, Unholy, and Griddy.
Plan 8-count phrases using recognizable moves from these trends. Return only valid JSON.`;

const CHOREOGRAPHY_SYSTEM = `You are a TikTok choreography engine. Create dances using REAL viral move vocabulary:
Renegade (cross, clap, swipe, woah, dougie), Say So (hip sway, point, body roll), Savage (elbow back, hip tick, hands up),
Blinding Lights (shimmy, pump, step), Lottery/Griddy (low bounce, hit dem folk).

${sequenceSummaryForPrompt()}

The avatar has 13 joints. Coordinates: center (0,0), head y≈0, ankles y≈1.65-1.75.
Each keyframe MUST include "stage". Dancer stays UPRIGHT — flip always 0, rotation -25 to 25 max.

Hit accents sharply; soft beats use smaller motion. Arms asymmetric like real TikTok (one arm hits, other relaxed).
Return only valid JSON.`;

type ChoreographRequest = {
  analysis: AudioAnalysis;
  style: DanceStyle;
  phraseCount: number;
};

function buildFallback(
  analysis: AudioAnalysis,
  style: DanceStyle,
  phraseCount: number,
  plan: DancePlan,
): Choreography {
  const phrases = Array.from({ length: phraseCount }, (_, idx) => {
    const beat = idx * 8 + 1;
    const onsets = Array.from({ length: 8 }, (_, beatIdx) => {
      const source = analysis.onset_per_beat.length
        ? analysis.onset_per_beat[(idx * 8 + beatIdx) % analysis.onset_per_beat.length]
        : 0.7;
      return source;
    });
    const phrasePlan = plan.phrases[idx];
    const phraseMoves = movesForPhrase(
      style,
      idx,
      onsets,
      phrasePlan?.tiktok_moves,
    );

    return {
      beat,
      duration_beats: 8,
      keyframes: FRAME_OFFSETS.map((offset, frameIndex) => {
        const onset = onsets[Math.min(frameIndex, onsets.length - 1)] ?? 0.7;
        const beatNum = offset + 1;
        const isAccent = phrasePlan?.accent_beats?.includes(beatNum) ?? onset > 1;
        const normalizedOnset = isAccent
          ? Math.min(1, Math.max(0.75, onset / 1.4))
          : Math.min(0.85, Math.max(0.45, onset / 2.8));
        const move = phraseMoves[frameIndex];
        return {
          frame_offset: offset,
          joints: applyMoveIntensity(move, normalizedOnset),
          stage: stageForMove(style, idx, frameIndex, move),
        };
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
    if (typeof p.beat !== "number" || typeof p.duration_beats !== "number" || !Array.isArray(p.keyframes)) {
      return false;
    }
    return p.keyframes.every((k) => {
      if (!k || typeof k !== "object") return false;
      const frame = k as { frame_offset?: unknown; joints?: unknown; stage?: unknown };
      if (typeof frame.frame_offset !== "number" || !frame.joints || typeof frame.joints !== "object") {
        return false;
      }
      const jointsOk = JOINT_NAMES.every((name) => {
        const point = (frame.joints as Record<string, unknown>)[name] as { x?: unknown; y?: unknown } | undefined;
        return point && typeof point.x === "number" && typeof point.y === "number";
      });
      if (!jointsOk) return false;
      if (frame.stage === undefined) return true;
      const s = frame.stage as Record<string, unknown>;
      return (
        typeof s.x === "number" &&
        typeof s.y === "number" &&
        typeof s.rotation === "number" &&
        typeof s.flip === "number" &&
        typeof s.facing === "number" &&
        typeof s.head_turn === "number"
      );
    });
  });
}

function enrichChoreographyStages(choreography: Choreography): Choreography {
  return {
    ...choreography,
    phrases: choreography.phrases.map((phrase, phraseIdx) => ({
      ...phrase,
      keyframes: phrase.keyframes.map((kf) => ({
        ...kf,
        stage: clampStagePhysics(
          kf.stage ? normalizeStage(kf.stage) : stageForPhraseFrame(phraseIdx, kf.frame_offset),
        ),
      })),
    })),
  };
}

async function analyzeWithClaude(
  apiKey: string,
  analysis: AudioAnalysis,
  style: DanceStyle,
  phraseCount: number,
): Promise<DancePlan> {
  const text = await callClaude(
    apiKey,
    DANCE_ANALYSIS_SYSTEM,
    buildDanceAnalysisPrompt(analysis, style, phraseCount),
    2000,
  );
  if (!text) return buildLocalDancePlan(analysis, style, phraseCount);
  const parsed = parseDancePlan(safeJsonParse<unknown>(text));
  if (!parsed || parsed.phrases.length < phraseCount) {
    const local = buildLocalDancePlan(analysis, style, phraseCount);
    if (parsed?.phrases?.length) {
      return {
        ...local,
        vibe: parsed.vibe || local.vibe,
        tiktok_style: parsed.tiktok_style || local.tiktok_style,
        human_notes: parsed.human_notes || local.human_notes,
        phrases: local.phrases.map((ph, i) => parsed.phrases[i] ?? ph),
      };
    }
    return local;
  }
  return parsed;
}

async function generateWithClaude(
  apiKey: string,
  analysis: AudioAnalysis,
  style: DanceStyle,
  phraseCount: number,
  plan: DancePlan,
): Promise<Choreography | null> {
  const text = await callClaude(
    apiKey,
    CHOREOGRAPHY_SYSTEM,
    buildChoreographyFromPlanPrompt(analysis, style, phraseCount, plan),
    12000,
  );
  if (!text) return null;
  const parsed = safeJsonParse<unknown>(text);
  if (!parsed || !validateChoreography(parsed)) return null;
  return enrichChoreographyStages(parsed);
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChoreographRequest;
  if (!body?.analysis || !body?.style) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const phraseCount = Math.min(Math.max(body.phraseCount || 8, 1), 12);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const plan = apiKey
    ? await analyzeWithClaude(apiKey, body.analysis, body.style, phraseCount)
    : buildLocalDancePlan(body.analysis, body.style, phraseCount);

  if (!apiKey) {
    return NextResponse.json(buildFallback(body.analysis, body.style, phraseCount, plan));
  }

  const choreography = await generateWithClaude(
    apiKey,
    body.analysis,
    body.style,
    phraseCount,
    plan,
  );

  if (choreography) {
    return NextResponse.json({
      ...choreography,
      meta: {
        vibe: plan.vibe,
        tiktok_style: plan.tiktok_style,
        human_notes: plan.human_notes,
        move_catalog: catalogSummaryForStyle(body.style),
        viral_sequences: sequenceSummaryForPrompt(),
      },
    });
  }

  return NextResponse.json(buildFallback(body.analysis, body.style, phraseCount, plan));
}
