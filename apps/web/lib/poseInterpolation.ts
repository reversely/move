import { BASE_POSE, JOINT_NAMES } from "@/lib/basePose";
import { applyGroundContact, enforceBoneLengths, enforceKneePhysics } from "@/lib/dancePhysics";
import { humanizePose, stabilizePose } from "@/lib/humanPose";
import { enrichPose } from "@/lib/poseEnrichment";
import type { JointName, JointPoint } from "@/lib/types";

export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) ** 5 / 2;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Smooth step — no overshoot (unlike Catmull-Rom). */
export function smoothStep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Playback easing — fluid motion without snappy accent cliffs. */
export function playbackEase(t: number): number {
  return easeInOutCubic(Math.min(1, Math.max(0, t)));
}

/** Snappy TikTok accent — for offline/keyframe generation only. */
export function tiktokBeatEase(t: number, accent: boolean): number {
  const clamped = Math.min(1, Math.max(0, t));
  if (!accent) return easeInOutQuint(clamped);
  if (clamped < 0.32) return easeOutCubic(clamped / 0.32) * 0.7;
  return 0.7 + easeInOutQuint((clamped - 0.32) / 0.68) * 0.3;
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

export type FinalizeOptions = {
  /** Softer humanize + single bone pass — use during live playback. */
  playback?: boolean;
};

/** Bone-aware polish after blend or keyframe load. */
export function finalizePose(
  pose: Record<JointName, JointPoint>,
  phase = 0.5,
  options: FinalizeOptions = {},
): Record<JointName, JointPoint> {
  const playback = options.playback ?? false;
  let p = humanizePose(enrichPose(pose), phase, playback);
  p = enforceKneePhysics(p);
  p = enforceBoneLengths(p, playback ? 1 : 2);
  p = applyGroundContact(p, false);
  return stabilizePose(p, playback);
}

export type TimedPoseInput = {
  t: number;
  joints: Record<JointName, JointPoint>;
};

export function findPoseSegment(poses: TimedPoseInput[], danceTime: number): {
  i1: number;
  i2: number;
  rawT: number;
} {
  if (poses.length < 2) return { i1: 0, i2: 0, rawT: 0 };

  let seg = 0;
  for (let j = 0; j < poses.length - 1; j += 1) {
    if (danceTime >= poses[j].t && danceTime < poses[j + 1].t) {
      seg = j;
      break;
    }
    if (j === poses.length - 2 && danceTime >= poses[j + 1].t) {
      seg = j;
    }
  }

  const i1 = seg;
  const i2 = Math.min(seg + 1, poses.length - 1);
  const segStart = poses[i1].t;
  const segEnd = poses[i2].t;
  const rawT = segEnd > segStart ? (danceTime - segStart) / (segEnd - segStart) : 0;
  return { i1, i2, rawT };
}

/** Eased lerp between two poses — no spline overshoot. */
export function lerpPoses(
  a: Record<JointName, JointPoint>,
  b: Record<JointName, JointPoint>,
  t: number,
): Record<JointName, JointPoint> {
  const eased = playbackEase(t);
  const result = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    result[name] = {
      x: a[name].x + (b[name].x - a[name].x) * eased,
      y: a[name].y + (b[name].y - a[name].y) * eased,
    };
  }
  return result;
}

/** Frame-to-frame display smoothing (exponential decay toward target). */
export function smoothTowardPose(
  current: Record<JointName, JointPoint> | null,
  target: Record<JointName, JointPoint>,
  factor: number,
): Record<JointName, JointPoint> {
  if (!current) return { ...target };
  const t = Math.min(1, Math.max(0.08, factor));
  const out = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    out[name] = {
      x: current[name].x + (target[name].x - current[name].x) * t,
      y: current[name].y + (target[name].y - current[name].y) * t,
    };
  }
  return out;
}

/** Smooth interpolation through keyframes for live playback. */
export function interpolatePoseAtTime(
  poses: TimedPoseInput[],
  danceTime: number,
  defaultPose: Record<JointName, JointPoint> = BASE_POSE,
  options: FinalizeOptions = { playback: true },
): Record<JointName, JointPoint> {
  if (!poses.length) return finalizePose(defaultPose, 0.5, options);
  if (poses.length === 1) return finalizePose(poses[0].joints ?? defaultPose, 0.5, options);

  if (danceTime <= poses[0].t) return finalizePose(poses[0].joints ?? defaultPose, 0.5, options);
  const last = poses[poses.length - 1];
  if (danceTime >= last.t) return finalizePose(last.joints ?? defaultPose, 0.5, options);

  const { i1, i2, rawT } = findPoseSegment(poses, danceTime);
  const p1 = poses[i1].joints ?? defaultPose;
  const p2 = poses[i2].joints ?? defaultPose;
  const eased = playbackEase(rawT);
  const blended = lerpPoses(p1, p2, rawT);

  return finalizePose(blended, eased, options);
}

/** Legacy Catmull-Rom path — snappier accents for export / fallback generation. */
export function interpolatePoseAtTimeSnappy(
  poses: TimedPoseInput[],
  danceTime: number,
  defaultPose: Record<JointName, JointPoint> = BASE_POSE,
): Record<JointName, JointPoint> {
  if (!poses.length) return finalizePose(defaultPose);
  if (poses.length === 1) return finalizePose(poses[0].joints ?? defaultPose);

  if (danceTime <= poses[0].t) return finalizePose(poses[0].joints ?? defaultPose);
  const last = poses[poses.length - 1];
  if (danceTime >= last.t) return finalizePose(last.joints ?? defaultPose);

  const { i1, i2, rawT } = findPoseSegment(poses, danceTime);
  const i0 = Math.max(0, i1 - 1);
  const i3 = Math.min(poses.length - 1, i2 + 1);

  const p0 = poses[i0].joints ?? defaultPose;
  const p1 = poses[i1].joints ?? defaultPose;
  const p2 = poses[i2].joints ?? defaultPose;
  const p3 = poses[i3].joints ?? defaultPose;

  const accent = poseDelta(p1, p2) > 0.42;
  const eased = tiktokBeatEase(rawT, accent);

  function catmullRom(p0n: number, p1n: number, p2n: number, p3n: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1n +
        (-p0n + p2n) * t +
        (2 * p0n - 5 * p1n + 4 * p2n - p3n) * t2 +
        (-p0n + 3 * p1n - 3 * p2n + p3n) * t3)
    );
  }

  const result = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    result[name] = {
      x: catmullRom(p0[name].x, p1[name].x, p2[name].x, p3[name].x, eased),
      y: catmullRom(p0[name].y, p1[name].y, p2[name].y, p3[name].y, eased),
    };
  }

  return finalizePose(result, eased, { playback: false });
}
