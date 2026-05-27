import type { JointName, JointPoint, StageTransform } from "@/lib/types";

import { BASE_POSE, JOINT_NAMES } from "@/lib/basePose";
import { easeInOutCubic } from "@/lib/humanPose";

/** Scaled simulation constants (normalized coordinate space). */
export const PHYSICS = {
  gravity: 0.42,
  groundAnkleY: 1.68,
  spring: 22,
  damping: 0.82,
  maxRotationDeg: 28,
  maxStageLeanDeg: 18,
} as const;

type JointVel = { vx: number; vy: number };
export type PhysicsSnapshot = {
  joints: Record<JointName, JointPoint & { vx: number; vy: number }>;
  stageVy: number;
};

const BONE_LENGTHS: [JointName, JointName, number][] = [
  ["neck", "head", 0.12],
  ["neck", "chest", 0.22],
  ["chest", "spine", 0.2],
  ["spine", "hip_l", 0.22],
  ["spine", "hip_r", 0.22],
  ["shoulder_l", "elbow_l", 0.28],
  ["elbow_l", "wrist_l", 0.3],
  ["wrist_l", "hand_l", 0.1],
  ["shoulder_r", "elbow_r", 0.28],
  ["elbow_r", "wrist_r", 0.3],
  ["wrist_r", "hand_r", 0.1],
  ["hip_l", "knee_l", 0.4],
  ["knee_l", "ankle_l", 0.48],
  ["ankle_l", "toe_l", 0.12],
  ["hip_r", "knee_r", 0.4],
  ["knee_r", "ankle_r", 0.48],
  ["ankle_r", "toe_r", 0.12],
];

const LOOSE_FOR_GRAVITY: JointName[] = [
  "wrist_l",
  "wrist_r",
  "hand_l",
  "hand_r",
  "elbow_l",
  "elbow_r",
  "head",
  "toe_l",
  "toe_r",
];

const JOINT_STIFFNESS: Partial<Record<JointName, number>> = {
  head: 16,
  neck: 18,
  chest: 22,
  spine: 22,
  ankle_l: 28,
  ankle_r: 28,
  toe_l: 14,
  toe_r: 14,
  knee_l: 24,
  knee_r: 24,
  hip_l: 20,
  hip_r: 20,
  wrist_l: 12,
  wrist_r: 12,
  hand_l: 10,
  hand_r: 10,
};

export function createPhysicsSnapshot(pose: Record<JointName, JointPoint>): PhysicsSnapshot {
  const joints = {} as PhysicsSnapshot["joints"];
  for (const name of JOINT_NAMES) {
    const p = pose[name] ?? BASE_POSE[name];
    joints[name] = { x: p.x, y: p.y, vx: 0, vy: 0 };
  }
  return { joints, stageVy: 0 };
}

/** Always upright — no upside-down. Clamp lean and drop flip. */
export function clampStagePhysics(stage: StageTransform): StageTransform {
  let rotation = stage.rotation % 360;
  if (rotation > 180) rotation -= 360;
  if (rotation < -180) rotation += 360;
  rotation = Math.max(-PHYSICS.maxRotationDeg, Math.min(PHYSICS.maxRotationDeg, rotation));

  return {
    x: stage.x,
    y: Math.max(0, stage.y),
    rotation,
    flip: 0,
    facing: stage.facing >= 0 ? 1 : -1,
    head_turn: stage.head_turn,
  };
}

function dist(a: JointPoint, b: JointPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function enforceBone(
  pose: Record<JointName, JointPoint>,
  parent: JointName,
  child: JointName,
  length: number,
): void {
  const p = pose[parent];
  const c = pose[child];
  const d = dist(p, c) || 1e-6;
  const t = length / d;
  pose[child] = {
    x: p.x + (c.x - p.x) * t,
    y: p.y + (c.y - p.y) * t,
  };
}

/** Keep limb segments at plausible lengths. */
export function enforceBoneLengths(
  pose: Record<JointName, JointPoint>,
  passes = 2,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const count = Math.max(1, Math.min(passes, 3));
  for (let pass = 0; pass < count; pass += 1) {
    for (const [parent, child, len] of BONE_LENGTHS) {
      enforceBone(out, parent, child, len);
    }
  }
  return out;
}

/** Knees bend forward (toward ground), not hyperextend. */
export function enforceKneePhysics(pose: Record<JointName, JointPoint>): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  for (const side of ["l", "r"] as const) {
    const hip = `hip_${side}` as JointName;
    const knee = `knee_${side}` as JointName;
    const ankle = `ankle_${side}` as JointName;
    const minKneeY = out[hip].y + 0.18;
    const maxKneeY = out[ankle].y - 0.22;
    out[knee] = {
      x: out[knee].x,
      y: Math.min(maxKneeY, Math.max(minKneeY, out[knee].y)),
    };
    if (out[knee].y <= out[hip].y + 0.15) {
      out[knee] = { x: out[hip].x + (side === "l" ? -0.06 : 0.06), y: out[hip].y + 0.22 };
    }
  }
  return out;
}

/** Feet stay on floor unless body is airborne; ankles align to ground plane. */
export function applyGroundContact(
  pose: Record<JointName, JointPoint>,
  airborne: boolean,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  if (airborne) return out;

  const ground = PHYSICS.groundAnkleY;
  const ankleY = Math.max(out.ankle_l.y, out.ankle_r.y);
  const sink = ankleY - ground;
  if (sink <= 0.001) return out;

  for (const name of JOINT_NAMES) {
    out[name] = { x: out[name].x, y: out[name].y - sink };
  }
  return out;
}

/** Arms and head lag slightly downward when in the air (gravity). */
export function applyLimbGravity(
  pose: Record<JointName, JointPoint>,
  gravityScale: number,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const g = PHYSICS.gravity * gravityScale;
  for (const name of LOOSE_FOR_GRAVITY) {
    out[name] = { x: out[name].x, y: out[name].y + g };
  }
  return out;
}

function springJoint(
  current: JointPoint & JointVel,
  target: JointPoint,
  dt: number,
  stiffness: number,
): JointPoint & JointVel {
  const ax = stiffness * (target.x - current.x) - PHYSICS.damping * current.vx;
  const ay = stiffness * (target.y - current.y) - PHYSICS.damping * current.vy;
  const vx = current.vx + ax * dt;
  const vy = current.vy + ay * dt;
  return {
    x: current.x + vx * dt,
    y: current.y + vy * dt,
    vx,
    vy,
  };
}

/** Advance physics state toward keyframe target with spring forces. */
export function stepPhysicsTowardTarget(
  state: PhysicsSnapshot,
  targetPose: Record<JointName, JointPoint>,
  airborne: boolean,
  dt: number,
): { pose: Record<JointName, JointPoint>; state: PhysicsSnapshot } {
  const next = createPhysicsSnapshot(BASE_POSE);
  for (const name of JOINT_NAMES) {
    const stiff = JOINT_STIFFNESS[name] ?? PHYSICS.spring;
    const cur = state.joints[name];
    const tgt = targetPose[name] ?? BASE_POSE[name];
    next.joints[name] = springJoint(cur, tgt, dt, stiff);
  }

  let pose = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    const j = next.joints[name];
    pose[name] = { x: j.x, y: j.y };
  }

  pose = applyLimbGravity(pose, airborne ? 1.4 : 0.35);
  pose = enforceKneePhysics(pose);
  pose = enforceBoneLengths(pose);
  pose = applyGroundContact(pose, airborne);

  for (const name of JOINT_NAMES) {
    const j = next.joints[name];
    const p = pose[name];
    next.joints[name] = { ...p, vx: j.vx * 0.92, vy: j.vy * 0.88 };
  }

  return { pose, state: next };
}

/** Blend keyframe targets with ease, then optional physics step. */
export function blendPoseTargets(
  a: Record<JointName, JointPoint>,
  b: Record<JointName, JointPoint>,
  t: number,
): Record<JointName, JointPoint> {
  const eased = easeInOutCubic(t);
  const result = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    result[name] = {
      x: a[name].x + (b[name].x - a[name].x) * eased,
      y: a[name].y + (b[name].y - a[name].y) * eased,
    };
  }
  return result;
}

/** Parabolic jump height for stage y (always upright). */
export function jumpArcY(progress: number, peak: number): number {
  return peak * 4 * progress * (1 - progress);
}
