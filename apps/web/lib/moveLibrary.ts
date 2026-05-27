import type { DanceStyle, JointName, JointPoint, StageTransform } from "@/lib/types";

import { BASE_POSE } from "@/lib/basePose";
import { getTiktokPhraseMoves, movesForSequenceName, pickSequence, poseById } from "@/lib/tiktokMoves";
import { mergeStages, normalizeStage, stageForPhraseFrame } from "@/lib/stageMotion";

export { BASE_POSE } from "@/lib/basePose";

export type DanceMove = {
  id: string;
  label: string;
  joints: Record<JointName, JointPoint>;
  stage?: StageTransform;
};

function move(
  id: string,
  label: string,
  joints: Partial<Record<JointName, JointPoint>>,
  stage?: Partial<StageTransform>,
): DanceMove {
  return {
    id,
    label,
    joints: { ...BASE_POSE, ...joints },
    stage: stage ? normalizeStage(stage) : undefined,
  };
}

const HYPE_MOVES: DanceMove[] = [
  move("wide_bounce", "Wide bounce", {
    hip_l: { x: -0.28, y: 0.88 },
    hip_r: { x: 0.28, y: 0.88 },
    knee_l: { x: -0.32, y: 1.22 },
    knee_r: { x: 0.32, y: 1.22 },
    ankle_l: { x: -0.38, y: 1.65 },
    ankle_r: { x: 0.38, y: 1.65 },
    wrist_l: { x: -0.55, y: 0.55 },
    wrist_r: { x: 0.55, y: 0.55 },
  }),
  move("left_lunge", "Left lunge", {
    hip_l: { x: -0.12, y: 0.9 },
    hip_r: { x: 0.22, y: 0.84 },
    knee_l: { x: -0.08, y: 1.05 },
    knee_r: { x: 0.34, y: 1.35 },
    ankle_l: { x: -0.05, y: 1.55 },
    ankle_r: { x: 0.42, y: 1.78 },
    wrist_l: { x: -0.35, y: 0.35 },
    wrist_r: { x: 0.6, y: 0.75 },
  }),
  move("right_lunge", "Right lunge", {
    hip_l: { x: -0.22, y: 0.84 },
    hip_r: { x: 0.12, y: 0.9 },
    knee_l: { x: -0.34, y: 1.35 },
    knee_r: { x: 0.08, y: 1.05 },
    ankle_l: { x: -0.42, y: 1.78 },
    ankle_r: { x: 0.05, y: 1.55 },
    wrist_l: { x: -0.6, y: 0.75 },
    wrist_r: { x: 0.35, y: 0.35 },
  }),
  move(
    "kick_l",
    "Kick left",
    {
      hip_l: { x: -0.2, y: 0.8 },
      hip_r: { x: 0.2, y: 0.86 },
      knee_l: { x: -0.35, y: 0.92 },
      knee_r: { x: 0.18, y: 1.28 },
      ankle_l: { x: -0.52, y: 0.88 },
      ankle_r: { x: 0.24, y: 1.72 },
      wrist_l: { x: -0.45, y: 0.2 },
      wrist_r: { x: 0.55, y: 0.65 },
    },
    { head_turn: 0.3 },
  ),
  move("kick_r", "Kick right", {
    hip_l: { x: -0.2, y: 0.86 },
    hip_r: { x: 0.2, y: 0.8 },
    knee_l: { x: -0.18, y: 1.28 },
    knee_r: { x: 0.35, y: 0.92 },
    ankle_l: { x: -0.24, y: 1.72 },
    ankle_r: { x: 0.52, y: 0.88 },
    wrist_l: { x: -0.55, y: 0.65 },
    wrist_r: { x: 0.45, y: 0.2 },
  }),
  move("squat_hit", "Squat hit", {
    head: { x: 0, y: 0.08 },
    shoulder_l: { x: -0.35, y: 0.32 },
    shoulder_r: { x: 0.35, y: 0.32 },
    hip_l: { x: -0.24, y: 0.98 },
    hip_r: { x: 0.24, y: 0.98 },
    knee_l: { x: -0.3, y: 1.15 },
    knee_r: { x: 0.3, y: 1.15 },
    ankle_l: { x: -0.28, y: 1.52 },
    ankle_r: { x: 0.28, y: 1.52 },
    wrist_l: { x: -0.62, y: 0.5 },
    wrist_r: { x: 0.62, y: 0.5 },
  }),
  move("step_touch_l", "Step touch left", {
    hip_l: { x: -0.32, y: 0.85 },
    hip_r: { x: 0.1, y: 0.84 },
    knee_l: { x: -0.38, y: 1.2 },
    knee_r: { x: 0.14, y: 1.32 },
    ankle_l: { x: -0.42, y: 1.62 },
    ankle_r: { x: 0.2, y: 1.75 },
    wrist_l: { x: -0.7, y: 0.6 },
    wrist_r: { x: 0.4, y: 0.8 },
  }),
  move("step_touch_r", "Step touch right", {
    hip_l: { x: -0.1, y: 0.84 },
    hip_r: { x: 0.32, y: 0.85 },
    knee_l: { x: -0.14, y: 1.32 },
    knee_r: { x: 0.38, y: 1.2 },
    ankle_l: { x: -0.2, y: 1.75 },
    ankle_r: { x: 0.42, y: 1.62 },
    wrist_l: { x: -0.4, y: 0.8 },
    wrist_r: { x: 0.7, y: 0.6 },
  }),
  move("arms_up_jack", "Jumping jack", {
    shoulder_l: { x: -0.42, y: 0.05 },
    shoulder_r: { x: 0.42, y: 0.05 },
    elbow_l: { x: -0.5, y: -0.15 },
    elbow_r: { x: 0.5, y: -0.15 },
    wrist_l: { x: -0.52, y: -0.35 },
    wrist_r: { x: 0.52, y: -0.35 },
    hip_l: { x: -0.3, y: 0.86 },
    hip_r: { x: 0.3, y: 0.86 },
    knee_l: { x: -0.36, y: 1.2 },
    knee_r: { x: 0.36, y: 1.2 },
    ankle_l: { x: -0.4, y: 1.6 },
    ankle_r: { x: 0.4, y: 1.6 },
  }),
  move("cross_step", "Cross step", {
    hip_l: { x: -0.08, y: 0.86 },
    hip_r: { x: 0.2, y: 0.88 },
    knee_l: { x: 0.05, y: 1.2 },
    knee_r: { x: -0.1, y: 1.25 },
    ankle_l: { x: 0.12, y: 1.68 },
    ankle_r: { x: -0.28, y: 1.7 },
    wrist_l: { x: -0.55, y: 0.45 },
    wrist_r: { x: 0.35, y: 0.55 },
  }),
];

const SMOOTH_MOVES: DanceMove[] = [
  move("sway_l", "Sway left", {
    hip_l: { x: -0.28, y: 0.84 },
    hip_r: { x: 0.12, y: 0.86 },
    knee_l: { x: -0.32, y: 1.22 },
    knee_r: { x: 0.18, y: 1.3 },
    ankle_l: { x: -0.36, y: 1.7 },
    ankle_r: { x: 0.22, y: 1.76 },
    wrist_l: { x: -0.58, y: 0.75 },
    wrist_r: { x: 0.45, y: 0.85 },
  }),
  move("sway_r", "Sway right", {
    hip_l: { x: -0.12, y: 0.86 },
    hip_r: { x: 0.28, y: 0.84 },
    knee_l: { x: -0.18, y: 1.3 },
    knee_r: { x: 0.32, y: 1.22 },
    ankle_l: { x: -0.22, y: 1.76 },
    ankle_r: { x: 0.36, y: 1.7 },
    wrist_l: { x: -0.45, y: 0.85 },
    wrist_r: { x: 0.58, y: 0.75 },
  }),
  move("slide_l", "Slide left", {
    hip_l: { x: -0.34, y: 0.88 },
    hip_r: { x: 0.08, y: 0.82 },
    knee_l: { x: -0.4, y: 1.24 },
    knee_r: { x: 0.12, y: 1.34 },
    ankle_l: { x: -0.48, y: 1.66 },
    ankle_r: { x: 0.16, y: 1.78 },
    elbow_l: { x: -0.5, y: 0.55 },
    elbow_r: { x: 0.42, y: 0.5 },
  }),
  move("slide_r", "Slide right", {
    hip_l: { x: -0.08, y: 0.82 },
    hip_r: { x: 0.34, y: 0.88 },
    knee_l: { x: -0.12, y: 1.34 },
    knee_r: { x: 0.4, y: 1.24 },
    ankle_l: { x: -0.16, y: 1.78 },
    ankle_r: { x: 0.48, y: 1.66 },
    elbow_l: { x: -0.42, y: 0.5 },
    elbow_r: { x: 0.5, y: 0.55 },
  }),
  move("plie", "Plie", {
    hip_l: { x: -0.22, y: 0.95 },
    hip_r: { x: 0.22, y: 0.95 },
    knee_l: { x: -0.28, y: 1.12 },
    knee_r: { x: 0.28, y: 1.12 },
    ankle_l: { x: -0.3, y: 1.5 },
    ankle_r: { x: 0.3, y: 1.5 },
    wrist_l: { x: -0.55, y: 0.85 },
    wrist_r: { x: 0.55, y: 0.85 },
  }),
  move("leg_swish_l", "Leg swish left", {
    knee_l: { x: -0.4, y: 1.05 },
    ankle_l: { x: -0.55, y: 1.35 },
    knee_r: { x: 0.2, y: 1.3 },
    ankle_r: { x: 0.26, y: 1.75 },
    wrist_l: { x: -0.65, y: 0.5 },
    wrist_r: { x: 0.5, y: 0.9 },
  }),
  move("leg_swish_r", "Leg swish right", {
    knee_r: { x: 0.4, y: 1.05 },
    ankle_r: { x: 0.55, y: 1.35 },
    knee_l: { x: -0.2, y: 1.3 },
    ankle_l: { x: -0.26, y: 1.75 },
    wrist_l: { x: -0.5, y: 0.9 },
    wrist_r: { x: 0.65, y: 0.5 },
  }),
  move("releve", "Releve", {
    hip_l: { x: -0.16, y: 0.78 },
    hip_r: { x: 0.16, y: 0.78 },
    knee_l: { x: -0.18, y: 1.05 },
    knee_r: { x: 0.18, y: 1.05 },
    ankle_l: { x: -0.2, y: 1.38 },
    ankle_r: { x: 0.2, y: 1.38 },
    head: { x: 0, y: -0.05 },
  }),
  move("wave_arms", "Wave", {
    elbow_l: { x: -0.35, y: 0.25 },
    elbow_r: { x: 0.5, y: 0.35 },
    wrist_l: { x: -0.25, y: 0.05 },
    wrist_r: { x: 0.65, y: 0.15 },
    knee_l: { x: -0.24, y: 1.2 },
    knee_r: { x: 0.26, y: 1.25 },
    ankle_l: { x: -0.28, y: 1.68 },
    ankle_r: { x: 0.3, y: 1.72 },
  }),
  move("slow_lunge_l", "Slow lunge L", {
    knee_l: { x: -0.1, y: 1.08 },
    ankle_l: { x: -0.08, y: 1.58 },
    knee_r: { x: 0.3, y: 1.38 },
    ankle_r: { x: 0.38, y: 1.8 },
    hip_l: { x: -0.14, y: 0.9 },
    hip_r: { x: 0.2, y: 0.84 },
  }),
];

const QUIRKY_MOVES: DanceMove[] = [
  move("flamingo_l", "Flamingo L", {
    knee_l: { x: -0.3, y: 0.95 },
    ankle_l: { x: -0.38, y: 1.2 },
    knee_r: { x: 0.2, y: 1.32 },
    ankle_r: { x: 0.24, y: 1.78 },
    wrist_l: { x: -0.4, y: 0.1 },
    wrist_r: { x: 0.6, y: 0.9 },
  }),
  move("flamingo_r", "Flamingo R", {
    knee_r: { x: 0.3, y: 0.95 },
    ankle_r: { x: 0.38, y: 1.2 },
    knee_l: { x: -0.2, y: 1.32 },
    ankle_l: { x: -0.24, y: 1.78 },
    wrist_r: { x: 0.4, y: 0.1 },
    wrist_l: { x: -0.6, y: 0.9 },
  }),
  move("zigzag", "Zigzag", {
    hip_l: { x: -0.25, y: 0.86 },
    hip_r: { x: 0.05, y: 0.9 },
    knee_l: { x: -0.35, y: 1.15 },
    knee_r: { x: 0.15, y: 1.28 },
    ankle_l: { x: -0.2, y: 1.65 },
    ankle_r: { x: 0.35, y: 1.72 },
    head: { x: 0.08, y: 0.02 },
  }),
  move("robot_knees", "Robot knees", {
    knee_l: { x: -0.15, y: 1.0 },
    knee_r: { x: 0.15, y: 1.0 },
    ankle_l: { x: -0.15, y: 1.45 },
    ankle_r: { x: 0.15, y: 1.45 },
    elbow_l: { x: -0.5, y: 0.35 },
    elbow_r: { x: 0.5, y: 0.35 },
    wrist_l: { x: -0.52, y: 0.35 },
    wrist_r: { x: 0.52, y: 0.35 },
  }),
  move("skate_l", "Skate left", {
    ankle_l: { x: -0.5, y: 1.55 },
    knee_l: { x: -0.42, y: 1.18 },
    hip_l: { x: -0.3, y: 0.84 },
    ankle_r: { x: 0.15, y: 1.78 },
    knee_r: { x: 0.12, y: 1.35 },
  }),
  move("skate_r", "Skate right", {
    ankle_r: { x: 0.5, y: 1.55 },
    knee_r: { x: 0.42, y: 1.18 },
    hip_r: { x: 0.3, y: 0.84 },
    ankle_l: { x: -0.15, y: 1.78 },
    knee_l: { x: -0.12, y: 1.35 },
  }),
  move("twist", "Twist", {
    hip_l: { x: -0.1, y: 0.88 },
    hip_r: { x: 0.26, y: 0.82 },
    knee_l: { x: -0.2, y: 1.25 },
    knee_r: { x: 0.38, y: 1.15 },
    ankle_l: { x: -0.32, y: 1.68 },
    ankle_r: { x: 0.45, y: 1.6 },
    shoulder_l: { x: -0.25, y: 0.22 },
    shoulder_r: { x: 0.35, y: 0.18 },
  }),
  move("hop_prep", "Hop prep", {
    hip_l: { x: -0.2, y: 0.92 },
    hip_r: { x: 0.2, y: 0.92 },
    knee_l: { x: -0.26, y: 1.08 },
    knee_r: { x: 0.26, y: 1.08 },
    ankle_l: { x: -0.28, y: 1.42 },
    ankle_r: { x: 0.28, y: 1.42 },
    head: { x: 0, y: 0.06 },
  }),
  move("dangle_l", "Dangle leg L", {
    ankle_l: { x: -0.45, y: 1.35 },
    knee_l: { x: -0.38, y: 1.0 },
    wrist_r: { x: 0.7, y: 0.4 },
    wrist_l: { x: -0.3, y: 0.5 },
  }),
  move("dangle_r", "Dangle leg R", {
    ankle_r: { x: 0.45, y: 1.35 },
    knee_r: { x: 0.38, y: 1.0 },
    wrist_l: { x: -0.7, y: 0.4 },
    wrist_r: { x: 0.3, y: 0.5 },
  }),
];

const POOLS: Record<DanceStyle, DanceMove[]> = {
  hype: HYPE_MOVES,
  smooth: SMOOTH_MOVES,
  quirky: QUIRKY_MOVES,
};

function lerpJoint(a: JointPoint, b: JointPoint, t: number): JointPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Blend a move toward base by (1 - intensity) so soft beats are subtler. */
export function applyMoveIntensity(
  move: DanceMove,
  intensity: number,
  base: Record<JointName, JointPoint> = BASE_POSE,
): Record<JointName, JointPoint> {
  const t = Math.min(1, Math.max(0.35, intensity));
  const result = {} as Record<JointName, JointPoint>;
  const names = Object.keys(base) as JointName[];
  for (const name of names) {
    result[name] = lerpJoint(base[name], move.joints[name], t);
  }
  return result;
}

/** Pick distinct moves for one 8-count phrase (every beat for human-like flow). */
export function stageForMove(
  style: DanceStyle,
  phraseIndex: number,
  frameIndex: number,
  move?: DanceMove,
): StageTransform {
  const path = stageForPhraseFrame(phraseIndex, frameIndex);
  return mergeStages(path, move?.stage);
}

export function movesForPhrase(
  style: DanceStyle,
  phraseIndex: number,
  _onsetHints: number[],
  tiktokMoveNames?: string[],
): DanceMove[] {
  if (tiktokMoveNames?.length) {
    for (const name of tiktokMoveNames) {
      const fromName = movesForSequenceName(name);
      if (fromName) return fromName;
    }
    const lower = tiktokMoveNames.join(" ").toLowerCase();
    if (lower.includes("renegade")) return getTiktokPhraseMoves(style, phraseIndex);
    if (lower.includes("say so")) return getTiktokPhraseMoves("smooth", phraseIndex);
    if (lower.includes("savage")) return getTiktokPhraseMoves("hype", phraseIndex);
  }

  return getTiktokPhraseMoves(style, phraseIndex);
}

export function listMoveNames(style: DanceStyle): string[] {
  const seq = pickSequence(style, 0);
  return seq.beats.map((id) => poseById(id).label);
}
