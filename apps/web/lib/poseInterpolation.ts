import { BASE_POSE, JOINT_NAMES } from "@/lib/basePose";
import { applyGroundContact, enforceBoneLengths, enforceKneePhysics } from "@/lib/dancePhysics";
import { humanizePose, stabilizePose } from "@/lib/humanPose";
import type { JointName, JointPoint } from "@/lib/types";

export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) ** 5 / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Snappy TikTok accent — quick attack, soft settle. */
export function tiktokBeatEase(t: number, accent: boolean): number {
  const clamped = Math.min(1, Math.max(0, t));
  if (!accent) return easeInOutQuint(clamped);
  if (clamped < 0.32) return easeOutCubic(clamped / 0.32) * 0.7;
  return 0.7 + easeInOutQuint((clamped - 0.32) / 0.68) * 0.3;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function poseDelta(
  a: Record<JointName, JointPoint>,
  b: Record<JointName, JointPoint>,
): number {
  let sum = 0;
  for (const name of JOINT_NAMES) {
    sum += Math.hypot(b[name].x - a[name].x, b[name].y - a[name].y);
  }
  return sum;
}

/** Bone-aware polish after blend or keyframe load. */
export function finalizePose(
  pose: Record<JointName, JointPoint>,
  phase = 0.5,
): Record<JointName, JointPoint> {
  let p = humanizePose(pose, phase);
  p = enforceKneePhysics(p);
  p = enforceBoneLengths(p);
  p = applyGroundContact(p, false);
  return stabilizePose(p);
}

export type TimedPoseInput = {
  t: number;
  joints: Record<JointName, JointPoint>;
};

/** Smooth spline through keyframes with TikTok-style accent easing. */
export function interpolatePoseAtTime(
  poses: TimedPoseInput[],
  danceTime: number,
  defaultPose: Record<JointName, JointPoint> = BASE_POSE,
): Record<JointName, JointPoint> {
  if (!poses.length) return finalizePose(defaultPose);
  if (poses.length === 1) return finalizePose(poses[0].joints ?? defaultPose);

  if (danceTime <= poses[0].t) return finalizePose(poses[0].joints ?? defaultPose);
  const last = poses[poses.length - 1];
  if (danceTime >= last.t) return finalizePose(last.joints ?? defaultPose);

  let seg = 0;
  for (let j = 0; j < poses.length - 1; j += 1) {
    if (danceTime >= poses[j].t && danceTime < poses[j + 1].t) {
      seg = j;
      break;
    }
  }

  const i1 = seg;
  const i2 = seg + 1;
  const i0 = Math.max(0, i1 - 1);
  const i3 = Math.min(poses.length - 1, i2 + 1);

  const p0 = poses[i0].joints ?? defaultPose;
  const p1 = poses[i1].joints ?? defaultPose;
  const p2 = poses[i2].joints ?? defaultPose;
  const p3 = poses[i3].joints ?? defaultPose;

  const segStart = poses[i1].t;
  const segEnd = poses[i2].t;
  const rawT = segEnd > segStart ? (danceTime - segStart) / (segEnd - segStart) : 0;
  const accent = poseDelta(p1, p2) > 0.42;
  const eased = tiktokBeatEase(rawT, accent);

  const result = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    result[name] = {
      x: catmullRom(p0[name].x, p1[name].x, p2[name].x, p3[name].x, eased),
      y: catmullRom(p0[name].y, p1[name].y, p2[name].y, p3[name].y, eased),
    };
  }

  return finalizePose(result, eased);
}
