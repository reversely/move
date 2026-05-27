import type { DanceStyle } from "@/lib/types";

import { pickSequence, poseById } from "@/lib/tiktokMoves";

export type TiktokMoveEntry = {
  id: string;
  name: string;
  description: string;
  styles: DanceStyle[];
};

/** Reference catalog — used by Claude dance analysis and fallback planning. */
export const TIKTOK_MOVE_CATALOG: TiktokMoveEntry[] = [
  {
    id: "bounce_groove",
    name: "Bounce groove",
    description: "Soft knee bounce, shoulders relaxed, weight shifting L-R on every beat — classic TikTok intro.",
    styles: ["hype", "smooth", "quirky"],
  },
  {
    id: "woah",
    name: "Woah",
    description: "Freeze with one arm across chest, slight lean back, knees bent — hit on snare.",
    styles: ["hype", "quirky"],
  },
  {
    id: "dougie",
    name: "Dougie",
    description: "Shoulder roll with loose arm swing, lean side to side, knees bouncing.",
    styles: ["hype", "smooth"],
  },
  {
    id: "point",
    name: "Point",
    description: "Sharp point forward/down on beat, other arm on hip, weight on back leg.",
    styles: ["hype", "quirky"],
  },
  {
    id: "arm_wave",
    name: "Arm wave",
    description: "Ripple shoulder → elbow → wrist on one side, hips still or subtle sway.",
    styles: ["smooth", "quirky"],
  },
  {
    id: "body_roll",
    name: "Body roll",
    description: "Chest forward, hips back, then reverse — smooth S-curve through torso.",
    styles: ["smooth", "hype"],
  },
  {
    id: "hip_tick",
    name: "Hip tick",
    description: "Quick hip pop to one side, knees bent, hands near waist — bass-driven.",
    styles: ["hype", "smooth"],
  },
  {
    id: "savage_hit",
    name: "Savage hit",
    description: "Strong elbow pull back with chest pop, wide stance, head slight tilt.",
    styles: ["hype"],
  },
  {
    id: "griddy_step",
    name: "Griddy step",
    description: "Low athletic stance, quick foot taps, arms pumping low — trending hip-hop.",
    styles: ["hype", "quirky"],
  },
  {
    id: "renegade_swipe",
    name: "Renegade swipe",
    description: "Cross-body arm swipe with wrist flick, step touch with opposite foot.",
    styles: ["hype", "quirky"],
  },
  {
    id: "milky_way",
    name: "Milky way arms",
    description: "Both arms flow overhead in arc, soft knees, dreamy smooth style.",
    styles: ["smooth"],
  },
  {
    id: "kick_ball_change",
    name: "Kick ball change",
    description: "Small kick front, step together, arms counter-swing — jazz/TikTok hybrid.",
    styles: ["hype", "smooth"],
  },
  {
    id: "lean_dab",
    name: "Lean dab",
    description: "Torso lean with elbow up near head, opposite arm straight down.",
    styles: ["quirky", "hype"],
  },
  {
    id: "shuffle_tap",
    name: "Shuffle tap",
    description: "Quick toe taps side to side, knees springy, arms loose at sides.",
    styles: ["hype", "quirky"],
  },
  {
    id: "hands_up_drop",
    name: "Hands up drop",
    description: "Arms shoot up on build, drop to chest level on bass drop with knee dip.",
    styles: ["hype"],
  },
  {
    id: "isolation_chest",
    name: "Chest isolation",
    description: "Chest forward/back without moving feet, hands relaxed at hips.",
    styles: ["smooth", "hype"],
  },
  {
    id: "viral_spin_prep",
    name: "Spin prep",
    description: "Collect arms in, knees coiled, weight on balls of feet — before a turn.",
    styles: ["hype", "quirky"],
  },
  {
    id: "fancy_feet",
    name: "Fancy feet",
    description: "Cross-step and uncross with hip sway, arms matching foot rhythm.",
    styles: ["smooth", "quirky"],
  },
  {
    id: "walk_through",
    name: "Walk through",
    description: "Travel across the frame left-to-right with natural arm swing and head looking forward.",
    styles: ["hype", "smooth", "quirky"],
  },
  {
    id: "turn_step",
    name: "Turn step",
    description: "Step and change facing left/right with slight body lean — stay upright, feet on floor.",
    styles: ["hype", "quirky"],
  },
  {
    id: "jump_land",
    name: "Jump land",
    description: "Hop straight up (both feet), tuck knees slightly in air, land with bent knees — always upright.",
    styles: ["hype"],
  },
  {
    id: "head_rolls",
    name: "Head rolls",
    description: "Feet planted, head turns and tilts side to side on groove — R&B hip-hop style.",
    styles: ["smooth", "hype"],
  },
  {
    id: "power_step",
    name: "Power step",
    description: "Big step forward with chest forward, arm punch on accent — breaking/hip-hop.",
    styles: ["hype"],
  },
  {
    id: "six_step",
    name: "Six-step",
    description: "Low footwork circle, body low, rotation in stage — breakdance inspired.",
    styles: ["hype", "quirky"],
  },
  {
    id: "moonwalk_slide",
    name: "Moonwalk slide",
    description: "Glide backward while facing forward, one foot sliding, smooth hip-hop.",
    styles: ["smooth", "quirky"],
  },
];

export function pickTiktokMovesForPhrase(
  style: DanceStyle,
  phraseIndex: number,
  _energy: "low" | "medium" | "high",
): string[] {
  const seq = pickSequence(style, phraseIndex);
  const accentPose = poseById(seq.beats[4] ?? "woah");
  return [seq.source.split("(")[0].trim(), accentPose.label];
}

export function catalogSummaryForStyle(style: DanceStyle): string {
  return TIKTOK_MOVE_CATALOG.filter((m) => m.styles.includes(style))
    .map((m) => m.name)
    .join(", ");
}
