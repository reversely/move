import type { DanceStyle, JointName, JointPoint, StageTransform } from "@/lib/types";

import { BASE_POSE } from "@/lib/basePose";
import type { DanceMove } from "@/lib/moveLibrary";

function m(
  id: string,
  label: string,
  joints: Partial<Record<JointName, JointPoint>>,
  stage?: Partial<StageTransform>,
): DanceMove {
  return {
    id,
    label,
    joints: { ...BASE_POSE, ...joints },
    stage: stage
      ? {
          x: stage.x ?? 0,
          y: stage.y ?? 0,
          rotation: stage.rotation ?? 0,
          flip: 0,
          facing: stage.facing ?? 1,
          head_turn: stage.head_turn ?? 0,
        }
      : undefined,
  };
}

/** Pose library modeled on viral TikTok choreography (Renegade, Say So, Savage, etc.). */
export const TIKTOK_POSES: Record<string, DanceMove> = {
  groove_bounce: m("groove_bounce", "Groove bounce", {
    hip_l: { x: -0.22, y: 0.86 },
    hip_r: { x: 0.22, y: 0.86 },
    knee_l: { x: -0.26, y: 1.2 },
    knee_r: { x: 0.26, y: 1.2 },
    wrist_l: { x: -0.48, y: 0.72 },
    wrist_r: { x: 0.48, y: 0.72 },
  }),

  // Renegade family
  renegade_cross: m("renegade_cross", "Renegade cross", {
    elbow_l: { x: -0.15, y: 0.35 },
    elbow_r: { x: 0.15, y: 0.35 },
    wrist_l: { x: 0.08, y: 0.42 },
    wrist_r: { x: -0.08, y: 0.42 },
    hip_l: { x: -0.2, y: 0.84 },
    hip_r: { x: 0.2, y: 0.84 },
  }),
  renegade_clap: m("renegade_clap", "Renegade clap under", {
    elbow_l: { x: -0.12, y: 0.55 },
    elbow_r: { x: 0.12, y: 0.55 },
    wrist_l: { x: 0.05, y: 0.62 },
    wrist_r: { x: -0.05, y: 0.62 },
    head: { x: 0, y: 0.04 },
  }),
  renegade_swipe: m("renegade_swipe", "Renegade swipe", {
    elbow_l: { x: -0.55, y: 0.38 },
    wrist_l: { x: -0.62, y: 0.55 },
    elbow_r: { x: 0.35, y: 0.48 },
    wrist_r: { x: 0.55, y: 0.65 },
    hip_l: { x: -0.28, y: 0.85 },
    knee_r: { x: 0.32, y: 1.22 },
  }),
  woah: m("woah", "Woah", {
    elbow_l: { x: -0.35, y: 0.32 },
    wrist_l: { x: -0.55, y: 0.38 },
    elbow_r: { x: 0.2, y: 0.45 },
    wrist_r: { x: 0.35, y: 0.58 },
    head: { x: -0.04, y: 0.02 },
    knee_l: { x: -0.24, y: 1.15 },
    knee_r: { x: 0.2, y: 1.2 },
  }, { head_turn: -0.2 }),
  dougie: m("dougie", "Dougie", {
    shoulder_l: { x: -0.34, y: 0.18 },
    shoulder_r: { x: 0.28, y: 0.24 },
    wrist_l: { x: -0.58, y: 0.48 },
    wrist_r: { x: 0.62, y: 0.55 },
    hip_l: { x: -0.26, y: 0.86 },
    hip_r: { x: 0.14, y: 0.88 },
  }),

  // Say So family
  sayso_hip: m("sayso_hip", "Say So hip sway", {
    hip_l: { x: -0.3, y: 0.84 },
    hip_r: { x: 0.1, y: 0.86 },
    wrist_l: { x: -0.38, y: 0.88 },
    wrist_r: { x: 0.38, y: 0.88 },
    knee_l: { x: -0.32, y: 1.2 },
    knee_r: { x: 0.18, y: 1.28 },
  }),
  sayso_point: m("sayso_point", "Say So point", {
    wrist_r: { x: 0.62, y: 0.35 },
    elbow_r: { x: 0.45, y: 0.42 },
    wrist_l: { x: -0.42, y: 0.82 },
    hip_r: { x: 0.22, y: 0.84 },
    knee_l: { x: -0.2, y: 1.25 },
  }, { head_turn: 0.35 }),
  sayso_roll: m("sayso_roll", "Say So body roll", {
    shoulder_l: { x: -0.32, y: 0.28 },
    shoulder_r: { x: 0.32, y: 0.28 },
    hip_l: { x: -0.2, y: 0.92 },
    hip_r: { x: 0.2, y: 0.92 },
    head: { x: 0, y: 0.06 },
    wrist_l: { x: -0.52, y: 0.78 },
    wrist_r: { x: 0.52, y: 0.78 },
  }),

  // Savage family
  savage_elbow: m("savage_elbow", "Savage elbow", {
    elbow_l: { x: -0.55, y: 0.38 },
    wrist_l: { x: -0.62, y: 0.32 },
    elbow_r: { x: 0.55, y: 0.38 },
    wrist_r: { x: 0.62, y: 0.32 },
    hip_l: { x: -0.28, y: 0.88 },
    hip_r: { x: 0.28, y: 0.88 },
    knee_l: { x: -0.32, y: 1.18 },
    knee_r: { x: 0.32, y: 1.18 },
  }),
  savage_hip_tick: m("savage_hip_tick", "Savage hip tick", {
    hip_l: { x: -0.32, y: 0.86 },
    hip_r: { x: 0.08, y: 0.88 },
    wrist_l: { x: -0.35, y: 0.85 },
    wrist_r: { x: 0.35, y: 0.85 },
    knee_l: { x: -0.36, y: 1.15 },
    knee_r: { x: 0.16, y: 1.28 },
  }),
  savage_hands_up: m("savage_hands_up", "Savage hands up", {
    elbow_l: { x: -0.42, y: -0.05 },
    elbow_r: { x: 0.42, y: -0.05 },
    wrist_l: { x: -0.48, y: -0.22 },
    wrist_r: { x: 0.48, y: -0.22 },
    knee_l: { x: -0.22, y: 1.2 },
    knee_r: { x: 0.22, y: 1.2 },
  }),

  // Blinding Lights / Lottery
  blinding_shimmy: m("blinding_shimmy", "Blinding Lights shimmy", {
    shoulder_l: { x: -0.34, y: 0.22 },
    shoulder_r: { x: 0.34, y: 0.18 },
    wrist_l: { x: -0.52, y: 0.55 },
    wrist_r: { x: 0.52, y: 0.55 },
    hip_l: { x: -0.2, y: 0.84 },
    hip_r: { x: 0.2, y: 0.84 },
  }),
  blinding_pump: m("blinding_pump", "Blinding Lights pump", {
    elbow_r: { x: 0.35, y: 0.15 },
    wrist_r: { x: 0.42, y: -0.05 },
    elbow_l: { x: -0.45, y: 0.5 },
    wrist_l: { x: -0.52, y: 0.65 },
    knee_r: { x: 0.18, y: 1.15 },
    ankle_l: { x: -0.28, y: 1.72 },
  }),
  lottery_low: m("lottery_low", "Lottery low bounce", {
    hip_l: { x: -0.26, y: 0.96 },
    hip_r: { x: 0.26, y: 0.96 },
    knee_l: { x: -0.3, y: 1.12 },
    knee_r: { x: 0.3, y: 1.12 },
    wrist_l: { x: -0.55, y: 0.62 },
    wrist_r: { x: 0.55, y: 0.62 },
    head: { x: 0, y: 0.08 },
  }),

  // About Damn Time / general viral
  damn_time_point: m("damn_time_point", "About Damn Time point", {
    wrist_l: { x: -0.58, y: 0.4 },
    elbow_l: { x: -0.42, y: 0.45 },
    wrist_r: { x: 0.4, y: 0.78 },
    hip_l: { x: -0.24, y: 0.84 },
    knee_r: { x: 0.28, y: 1.22 },
  }),
  unholy_sway: m("unholy_sway", "Unholy sway", {
    hip_l: { x: -0.28, y: 0.85 },
    hip_r: { x: 0.12, y: 0.87 },
    wrist_l: { x: -0.45, y: 0.75 },
    wrist_r: { x: 0.55, y: 0.55 },
    head: { x: 0.06, y: 0.02 },
  }),

  // Footwork
  griddy: m("griddy", "Griddy", {
    hip_l: { x: -0.24, y: 0.92 },
    hip_r: { x: 0.24, y: 0.92 },
    knee_l: { x: -0.32, y: 1.08 },
    knee_r: { x: 0.28, y: 1.12 },
    ankle_l: { x: -0.38, y: 1.55 },
    wrist_l: { x: -0.45, y: 0.55 },
    wrist_r: { x: 0.45, y: 0.58 },
  }),
  step_touch: m("step_touch", "Step touch", {
    hip_l: { x: -0.34, y: 0.85 },
    hip_r: { x: 0.08, y: 0.84 },
    ankle_l: { x: -0.42, y: 1.62 },
    ankle_r: { x: 0.18, y: 1.75 },
    wrist_l: { x: -0.65, y: 0.55 },
    wrist_r: { x: 0.35, y: 0.72 },
  }),
  hit_dem: m("hit_dem", "Hit dem folk", {
    elbow_l: { x: -0.5, y: 0.25 },
    wrist_l: { x: -0.58, y: 0.15 },
    elbow_r: { x: 0.5, y: 0.25 },
    wrist_r: { x: 0.58, y: 0.15 },
    knee_l: { x: -0.28, y: 1.12 },
    knee_r: { x: 0.28, y: 1.12 },
  }),
};

export type TikTokSequence = {
  id: string;
  /** Viral dance this sequence is based on */
  source: string;
  styles: DanceStyle[];
  /** One pose id per beat (frames 0–8) */
  beats: string[];
};

/** 8-count sequences inspired by real viral TikTok choreography. */
export const TIKTOK_SEQUENCES: TikTokSequence[] = [
  {
    id: "renegade_a",
    source: "Renegade (Jalaiah Harmon)",
    styles: ["hype", "quirky"],
    beats: [
      "groove_bounce",
      "renegade_cross",
      "renegade_clap",
      "renegade_swipe",
      "woah",
      "dougie",
      "renegade_swipe",
      "hit_dem",
      "woah",
    ],
  },
  {
    id: "renegade_b",
    source: "Renegade variation",
    styles: ["hype", "quirky"],
    beats: [
      "renegade_cross",
      "renegade_clap",
      "woah",
      "dougie",
      "renegade_swipe",
      "hit_dem",
      "groove_bounce",
      "renegade_swipe",
      "woah",
    ],
  },
  {
    id: "sayso_a",
    source: "Say So (Doja Cat)",
    styles: ["smooth", "hype"],
    beats: [
      "sayso_hip",
      "sayso_point",
      "sayso_roll",
      "sayso_hip",
      "sayso_point",
      "damn_time_point",
      "sayso_roll",
      "sayso_hip",
      "sayso_point",
    ],
  },
  {
    id: "savage_a",
    source: "Savage (Megan Thee Stallion)",
    styles: ["hype"],
    beats: [
      "groove_bounce",
      "savage_elbow",
      "savage_elbow",
      "savage_hip_tick",
      "savage_hip_tick",
      "sayso_point",
      "savage_hands_up",
      "savage_elbow",
      "hit_dem",
    ],
  },
  {
    id: "blinding_a",
    source: "Blinding Lights challenge",
    styles: ["hype", "quirky"],
    beats: [
      "blinding_shimmy",
      "blinding_pump",
      "blinding_pump",
      "step_touch",
      "blinding_shimmy",
      "woah",
      "blinding_pump",
      "step_touch",
      "groove_bounce",
    ],
  },
  {
    id: "lottery_a",
    source: "Lottery (K CAMP)",
    styles: ["hype", "quirky"],
    beats: [
      "lottery_low",
      "hit_dem",
      "lottery_low",
      "griddy",
      "hit_dem",
      "lottery_low",
      "griddy",
      "hit_dem",
      "groove_bounce",
    ],
  },
  {
    id: "damn_time_a",
    source: "About Damn Time (Lizzo)",
    styles: ["smooth", "hype"],
    beats: [
      "damn_time_point",
      "sayso_hip",
      "sayso_roll",
      "damn_time_point",
      "unholy_sway",
      "sayso_point",
      "sayso_roll",
      "damn_time_point",
      "groove_bounce",
    ],
  },
  {
    id: "unholy_a",
    source: "Unholy (Sam Smith / Kim Petras trend)",
    styles: ["smooth", "quirky"],
    beats: [
      "unholy_sway",
      "sayso_hip",
      "sayso_point",
      "unholy_sway",
      "sayso_roll",
      "damn_time_point",
      "unholy_sway",
      "sayso_hip",
      "sayso_point",
    ],
  },
  {
    id: "griddy_combo",
    source: "Griddy / hip-hop TikTok",
    styles: ["hype"],
    beats: [
      "griddy",
      "griddy",
      "step_touch",
      "hit_dem",
      "griddy",
      "savage_hip_tick",
      "step_touch",
      "griddy",
      "savage_hands_up",
    ],
  },
  {
    id: "smooth_groove",
    source: "Viral smooth groove",
    styles: ["smooth"],
    beats: [
      "sayso_hip",
      "sayso_roll",
      "unholy_sway",
      "damn_time_point",
      "sayso_hip",
      "sayso_roll",
      "unholy_sway",
      "sayso_point",
      "groove_bounce",
    ],
  },
  {
    id: "quirky_viral",
    source: "Quirky viral mix",
    styles: ["quirky"],
    beats: [
      "woah",
      "dougie",
      "hit_dem",
      "blinding_shimmy",
      "renegade_clap",
      "lottery_low",
      "woah",
      "griddy",
      "hit_dem",
    ],
  },
];

export function poseById(id: string): DanceMove {
  return TIKTOK_POSES[id] ?? TIKTOK_POSES.groove_bounce;
}

export function sequencesForStyle(style: DanceStyle): TikTokSequence[] {
  return TIKTOK_SEQUENCES.filter((s) => s.styles.includes(style));
}

export function pickSequence(style: DanceStyle, phraseIndex: number): TikTokSequence {
  const pool = sequencesForStyle(style);
  if (!pool.length) return TIKTOK_SEQUENCES[0];
  return pool[phraseIndex % pool.length];
}

/** Full 9-beat phrase using a viral TikTok 8-count. */
export function getTiktokPhraseMoves(style: DanceStyle, phraseIndex: number): DanceMove[] {
  const seq = pickSequence(style, phraseIndex);
  return seq.beats.map((id) => poseById(id));
}

export function sequenceSummaryForPrompt(): string {
  return TIKTOK_SEQUENCES.map(
    (s) =>
      `${s.source}: beats 1-8 → ${s.beats.slice(1, 9).map((b) => TIKTOK_POSES[b]?.label ?? b).join(" → ")}`,
  ).join("\n");
}

export function movesForSequenceName(name: string): DanceMove[] | null {
  const lower = name.toLowerCase();
  const seq = TIKTOK_SEQUENCES.find(
    (s) =>
      s.source.toLowerCase().includes(lower) ||
      s.id.includes(lower) ||
      lower.includes(s.id.replace("_a", "")),
  );
  return seq ? seq.beats.map((id) => poseById(id)) : null;
}
