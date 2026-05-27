import type { StageTransform } from "@/lib/types";

import { easeInOutCubic } from "@/lib/humanPose";
import { clampStagePhysics, jumpArcY } from "@/lib/dancePhysics";

export const DEFAULT_STAGE: StageTransform = {
  x: 0,
  y: 0,
  rotation: 0,
  flip: 0,
  facing: 1,
  head_turn: 0,
};

export function normalizeStage(raw?: Partial<StageTransform> | null): StageTransform {
  return clampStagePhysics({
    x: raw?.x ?? 0,
    y: raw?.y ?? 0,
    rotation: raw?.rotation ?? 0,
    flip: 0,
    facing: raw?.facing ?? 1,
    head_turn: raw?.head_turn ?? 0,
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function blendStage(a: StageTransform, b: StageTransform, t: number): StageTransform {
  const e = easeInOutCubic(t);
  return normalizeStage({
    x: lerp(a.x, b.x, e),
    y: lerp(a.y, b.y, e),
    rotation: lerp(a.rotation, b.rotation, e),
    flip: 0,
    facing: e < 0.5 ? a.facing : b.facing,
    head_turn: lerp(a.head_turn, b.head_turn, e),
  });
}

type StagePattern = (frame: number) => StageTransform;

const walkRight: StagePattern = (f) => ({
  x: -0.55 + (f / 8) * 1.1,
  y: f % 2 === 0 ? 0 : 0.02,
  rotation: f % 4 === 0 ? 4 : -3,
  flip: 0,
  facing: 1,
  head_turn: Math.sin(f * 0.9) * 0.25,
});

const walkLeft: StagePattern = (f) => ({
  x: 0.55 - (f / 8) * 1.1,
  y: f % 2 === 0 ? 0 : 0.02,
  rotation: f % 4 === 0 ? -4 : 3,
  flip: 0,
  facing: -1,
  head_turn: Math.cos(f * 0.7) * 0.3,
});

/** Upright turn — facing changes, slight lean only */
const turnInPlace: StagePattern = (f) => ({
  x: 0.08 * Math.sin((f / 8) * Math.PI),
  y: 0,
  rotation: f < 4 ? f * 4 : (8 - f) * 4,
  flip: 0,
  facing: f < 4 ? 1 : -1,
  head_turn: 0,
});

const jumpTravel: StagePattern = (f) => {
  const hop = f % 2 === 1;
  return {
    x: -0.35 + (f / 8) * 0.7,
    y: hop ? 0.12 : 0,
    rotation: hop ? -6 : 4,
    flip: 0,
    facing: 1,
    head_turn: f === 3 ? 0.4 : f === 7 ? -0.35 : 0,
  };
};

/** Jump and land — parabolic height, always upright */
const jumpLand: StagePattern = (f) => {
  const progress = f >= 2 && f <= 6 ? (f - 2) / 4 : 0;
  const y = progress > 0 ? jumpArcY(progress, 0.2) : 0;
  return {
    x: -0.15 + (f / 8) * 0.35,
    y,
    rotation: f === 4 ? -8 : f === 5 ? 6 : 0,
    flip: 0,
    facing: 1,
    head_turn: 0,
  };
};

const headGroove: StagePattern = (f) => ({
  x: 0.05 * Math.sin(f * 0.5),
  y: 0,
  rotation: 0,
  flip: 0,
  facing: 1,
  head_turn: Math.sin(f * 1.2) * 0.65,
});

const hipHopSlide: StagePattern = (f) => ({
  x: f < 4 ? -0.4 + f * 0.15 : 0.2 - (f - 4) * 0.1,
  y: 0,
  rotation: f === 4 ? 12 : f === 5 ? -10 : 0,
  flip: 0,
  facing: f < 4 ? 1 : -1,
  head_turn: f >= 6 ? 0.5 : -0.2,
});

const grooveLow: StagePattern = (f) => ({
  x: 0.2 * Math.cos((f / 8) * Math.PI),
  y: 0,
  rotation: (f - 4) * 2.5,
  flip: 0,
  facing: f % 4 < 2 ? 1 : -1,
  head_turn: 0.15,
});

const powerStep: StagePattern = (f) => ({
  x: -0.5 + (f / 8) * 1.0,
  y: f === 2 || f === 6 ? jumpArcY(0.5, 0.1) : 0,
  rotation: f === 4 ? -12 : f === 5 ? 10 : 0,
  flip: 0,
  facing: 1,
  head_turn: Math.sin(f) * 0.2,
});

const PHRASE_PATTERNS: StagePattern[] = [
  walkRight,
  headGroove,
  jumpTravel,
  turnInPlace,
  hipHopSlide,
  jumpLand,
  walkLeft,
  grooveLow,
  powerStep,
];

export function stageForPhraseFrame(phraseIndex: number, frameIndex: number): StageTransform {
  const pattern = PHRASE_PATTERNS[phraseIndex % PHRASE_PATTERNS.length];
  return normalizeStage(pattern(frameIndex));
}

export function mergeStages(base: StageTransform, overlay?: Partial<StageTransform>): StageTransform {
  if (!overlay) return base;
  return normalizeStage({
    x: base.x + (overlay.x ?? 0) * 0.35,
    y: base.y + (overlay.y ?? 0),
    rotation: base.rotation + (overlay.rotation ?? 0) * 0.5,
    flip: 0,
    facing: overlay.facing ?? base.facing,
    head_turn: base.head_turn + (overlay.head_turn ?? 0),
  });
}
