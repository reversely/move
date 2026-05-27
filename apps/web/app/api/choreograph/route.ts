import { NextResponse } from "next/server";

import { callClaude, safeJsonParse } from "@/lib/claudeClient";
import {
  buildChoreographyFromPlanPrompt,
  buildDanceAnalysisPrompt,
  buildLocalDancePlan,
  parseDancePlan,
  type DancePlan,
} from "@/lib/dancePlan";
import { applyMoveIntensity, lerpJointPoses, movesForPhrase, stageForMove } from "@/lib/moveLibrary";
import { clampStagePhysics } from "@/lib/dancePhysics";
import { normalizeStage, stageForPhraseFrame } from "@/lib/stageMotion";
import { choreographySystemPrompt, halfBeatKeyframeInstruction } from "@/lib/choreographyPrompt";
import { enrichPose } from "@/lib/poseEnrichment";
import { finalizePose } from "@/lib/poseInterpolation";
import { catalogSummaryForStyle } from "@/lib/tiktokCatalog";
import { sequenceSummaryForPrompt } from "@/lib/tiktokMoves";
import { CORE_JOINT_NAMES } from "@/lib/basePose";
import type { AudioAnalysis, Choreography, DanceStyle } from "@/lib/types";

const FRAME_OFFSETS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];

const DANCE_ANALYSIS_SYSTEM = `You are an expert TikTok choreographer who plans dances for a 19-joint dance mannequin with viral move vocabulary.
Know: Renegade, Say So, Savage, Blinding Lights, Lottery, About Damn Time, Unholy, Griddy.
Plan 8-count phrases with DISTINCT move combos, accent_beats on hard hits, and stage travel (walk, turn, jump_land, slide).
${halfBeatKeyframeInstruction()}
Return only valid JSON.`;

const CHOREOGRAPHY_SYSTEM = choreographySystemPrompt();

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
      keyframes: FRAME_OFFSETS.map((offset) => {
        const beatIdx = Math.floor(offset);
        const frac = offset - beatIdx;
        const onset = onsets[Math.min(beatIdx, onsets.length - 1)] ?? 0.7;
        const beatNum = beatIdx + 1;
        const isAccent = phrasePlan?.accent_beats?.includes(beatNum) ?? onset > 1;
        const normalizedOnset = isAccent
          ? Math.min(1, Math.max(0.75, onset / 1.4))
          : Math.min(0.85, Math.max(0.45, onset / 2.8));
        const moveA = phraseMoves[Math.min(beatIdx, phraseMoves.length - 1)];
        const moveB = phraseMoves[Math.min(beatIdx + 1, phraseMoves.length - 1)];
        const poseA = applyMoveIntensity(moveA, normalizedOnset);
        const poseB = applyMoveIntensity(moveB, normalizedOnset);
        const joints = finalizePose(frac < 0.01 ? poseA : lerpJointPoses(poseA, poseB, frac));
        return {
          frame_offset: offset,
          joints,
          stage: stageForMove(style, idx, beatIdx, moveA),
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
      const jointsOk = CORE_JOINT_NAMES.every((name) => {
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
        joints: finalizePose(enrichPose(kf.joints)),
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
    16000,
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
    return NextResponse.json(enrichChoreographyStages(buildFallback(body.analysis, body.style, phraseCount, plan)));
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

  return NextResponse.json(enrichChoreographyStages(buildFallback(body.analysis, body.style, phraseCount, plan)));
}
