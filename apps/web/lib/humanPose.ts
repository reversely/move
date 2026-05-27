import type { JointName, JointPoint } from "@/lib/types";

import { BASE_POSE } from "@/lib/basePose";

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Light polish after keyframe blend — torso counter-rotation and limb follow-through. */
export function humanizePose(
  pose: Record<JointName, JointPoint>,
  phase: number,
  playback = false,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const shoulderMid = midpoint(pose.shoulder_l, pose.shoulder_r);
  const hipMid = midpoint(pose.hip_l, pose.hip_r);
  const twistScale = playback ? 0.08 : 0.14;
  const torsoTwist = (hipMid.x - shoulderMid.x) * twistScale;

  out.head = {
    x: pose.head.x * 0.6 + pose.neck.x * 0.4 + torsoTwist * 0.25,
    y: Math.min(pose.head.y, pose.neck.y - 0.04),
  };
  out.neck = {
    x: pose.neck.x + torsoTwist * 0.15,
    y: pose.neck.y,
  };
  out.chest = {
    x: pose.chest.x + torsoTwist * 0.25,
    y: pose.chest.y,
  };
  out.spine = {
    x: pose.spine.x + torsoTwist * 0.35,
    y: pose.spine.y,
  };

  if (!playback) {
    const leftWeight = pose.knee_l.y < pose.knee_r.y;
    const sway = Math.sin(phase * Math.PI) * 0.018;
    if (leftWeight) {
      out.shoulder_l = { x: pose.shoulder_l.x - 0.02 + sway, y: pose.shoulder_l.y + 0.012 };
      out.shoulder_r = { x: pose.shoulder_r.x + 0.025 - sway, y: pose.shoulder_r.y };
      out.hip_r = { x: pose.hip_r.x + 0.01, y: pose.hip_r.y + 0.008 };
      out.toe_l = { x: pose.toe_l.x - 0.01, y: pose.toe_l.y };
      out.toe_r = { x: pose.toe_r.x + 0.008, y: pose.toe_r.y + 0.006 };
    } else {
      out.shoulder_r = { x: pose.shoulder_r.x + 0.02 - sway, y: pose.shoulder_r.y + 0.012 };
      out.shoulder_l = { x: pose.shoulder_l.x - 0.025 + sway, y: pose.shoulder_l.y };
      out.hip_l = { x: pose.hip_l.x - 0.01, y: pose.hip_l.y + 0.008 };
      out.toe_r = { x: pose.toe_r.x + 0.01, y: pose.toe_r.y };
      out.toe_l = { x: pose.toe_l.x - 0.008, y: pose.toe_l.y + 0.006 };
    }

    const armLag = 0.04 * Math.sin(phase * Math.PI * 2);
    out.hand_l = { x: pose.hand_l.x + armLag, y: pose.hand_l.y + armLag * 0.45 };
    out.hand_r = { x: pose.hand_r.x - armLag, y: pose.hand_r.y + armLag * 0.45 };
    out.wrist_l = {
      x: pose.wrist_l.x + armLag * 0.6,
      y: pose.wrist_l.y + armLag * 0.35,
    };
    out.wrist_r = {
      x: pose.wrist_r.x - armLag * 0.6,
      y: pose.wrist_r.y + armLag * 0.35,
    };
    out.elbow_l = {
      x: pose.elbow_l.x + (pose.wrist_l.x - pose.elbow_l.x) * 0.03,
      y: pose.elbow_l.y,
    };
    out.elbow_r = {
      x: pose.elbow_r.x + (pose.wrist_r.x - pose.elbow_r.x) * 0.03,
      y: pose.elbow_r.y,
    };
  }

  return out;
}

/** Fix collapsed knees or shoulders without moving the head. */
export function stabilizePose(
  pose: Record<JointName, JointPoint>,
  playback = false,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const minKneeY = 1.0;
  const maxKneeY = 1.45;
  for (const side of ["l", "r"] as const) {
    const knee = `knee_${side}` as JointName;
    const ankle = `ankle_${side}` as JointName;
    const toe = `toe_${side}` as JointName;
    if (out[knee].y < minKneeY) out[knee] = { ...out[knee], y: minKneeY };
    if (out[knee].y > maxKneeY) out[knee] = { ...out[knee], y: maxKneeY };
    if (out[ankle].y < out[knee].y + 0.25) {
      out[ankle] = { x: out[ankle].x, y: out[knee].y + 0.35 };
    }
    if (out[toe].y < out[ankle].y + 0.04) {
      out[toe] = { x: out[toe].x, y: out[ankle].y + 0.06 };
    }
  }

  const shoulderSpan = Math.abs(out.shoulder_l.x - out.shoulder_r.x);
  if (shoulderSpan < 0.35) {
    const blend = playback ? 0.35 : 1;
    out.shoulder_l = {
      x: lerp(out.shoulder_l.x, BASE_POSE.shoulder_l.x, blend),
      y: lerp(out.shoulder_l.y, BASE_POSE.shoulder_l.y, blend),
    };
    out.shoulder_r = {
      x: lerp(out.shoulder_r.x, BASE_POSE.shoulder_r.x, blend),
      y: lerp(out.shoulder_r.y, BASE_POSE.shoulder_r.y, blend),
    };
  }

  if (out.chest.y > out.spine.y - 0.06) {
    out.chest = { ...out.chest, y: out.spine.y - 0.1 };
  }
  return out;
}
