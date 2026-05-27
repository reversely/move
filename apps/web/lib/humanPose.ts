import type { JointName, JointPoint } from "@/lib/types";

import { BASE_POSE } from "@/lib/basePose";

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Light polish after keyframe blend — torso counter-rotation and head stability. */
export function humanizePose(
  pose: Record<JointName, JointPoint>,
  phase: number,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const shoulderMidX = (pose.shoulder_l.x + pose.shoulder_r.x) / 2;
  const shoulderMidY = (pose.shoulder_l.y + pose.shoulder_r.y) / 2;
  const hipMidX = (pose.hip_l.x + pose.hip_r.x) / 2;
  const hipMidY = (pose.hip_l.y + pose.hip_r.y) / 2;

  const torsoTwist = (hipMidX - shoulderMidX) * 0.12;
  out.head = {
    x: pose.head.x * 0.6 + shoulderMidX * 0.4 + torsoTwist * 0.5,
    y: Math.min(pose.head.y, shoulderMidY - 0.08),
  };

  const leftWeight = pose.knee_l.y < pose.knee_r.y;
  const sway = Math.sin(phase * Math.PI) * 0.018;
  if (leftWeight) {
    out.shoulder_l = { x: pose.shoulder_l.x - 0.02 + sway, y: pose.shoulder_l.y + 0.012 };
    out.shoulder_r = { x: pose.shoulder_r.x + 0.025 - sway, y: pose.shoulder_r.y };
    out.hip_r = { x: pose.hip_r.x + 0.01, y: pose.hip_r.y + 0.008 };
  } else {
    out.shoulder_r = { x: pose.shoulder_r.x + 0.02 - sway, y: pose.shoulder_r.y + 0.012 };
    out.shoulder_l = { x: pose.shoulder_l.x - 0.025 + sway, y: pose.shoulder_l.y };
    out.hip_l = { x: pose.hip_l.x - 0.01, y: pose.hip_l.y + 0.008 };
  }

  const armLag = 0.04 * Math.sin(phase * Math.PI * 2);
  out.wrist_l = { x: pose.wrist_l.x + armLag, y: pose.wrist_l.y + armLag * 0.5 };
  out.wrist_r = { x: pose.wrist_r.x - armLag, y: pose.wrist_r.y + armLag * 0.5 };
  out.elbow_l = {
    x: pose.elbow_l.x + (pose.wrist_l.x - pose.elbow_l.x) * 0.03,
    y: pose.elbow_l.y,
  };
  out.elbow_r = {
    x: pose.elbow_r.x + (pose.wrist_r.x - pose.elbow_r.x) * 0.03,
    y: pose.elbow_r.y,
  };

  return out;
}

/** Fix collapsed knees or shoulders without moving the head. */
export function stabilizePose(pose: Record<JointName, JointPoint>): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const minKneeY = 1.0;
  const maxKneeY = 1.45;
  for (const side of ["l", "r"] as const) {
    const knee = `knee_${side}` as JointName;
    const ankle = `ankle_${side}` as JointName;
    if (out[knee].y < minKneeY) out[knee] = { ...out[knee], y: minKneeY };
    if (out[knee].y > maxKneeY) out[knee] = { ...out[knee], y: maxKneeY };
    if (out[ankle].y < out[knee].y + 0.25) {
      out[ankle] = { x: out[ankle].x, y: out[knee].y + 0.35 };
    }
  }
  if (Math.abs(out.shoulder_l.x - out.shoulder_r.x) < 0.35) {
    out.shoulder_l = { ...BASE_POSE.shoulder_l };
    out.shoulder_r = { ...BASE_POSE.shoulder_r };
  }
  return out;
}
