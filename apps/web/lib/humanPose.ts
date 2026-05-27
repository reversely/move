import type { JointName, JointPoint } from "@/lib/types";

import { BASE_POSE } from "@/lib/basePose";

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Light polish after keyframe blend — keeps head stable above the torso. */
export function humanizePose(
  pose: Record<JointName, JointPoint>,
  _phase: number,
): Record<JointName, JointPoint> {
  const out = { ...pose } as Record<JointName, JointPoint>;
  const shoulderMidX = (pose.shoulder_l.x + pose.shoulder_r.x) / 2;
  const shoulderMidY = (pose.shoulder_l.y + pose.shoulder_r.y) / 2;

  out.head = {
    x: pose.head.x * 0.65 + shoulderMidX * 0.35,
    y: Math.min(pose.head.y, shoulderMidY - 0.08),
  };

  const leftWeight = pose.knee_l.y < pose.knee_r.y;
  if (leftWeight) {
    out.shoulder_l = { x: pose.shoulder_l.x - 0.015, y: pose.shoulder_l.y + 0.01 };
    out.shoulder_r = { x: pose.shoulder_r.x + 0.02, y: pose.shoulder_r.y };
  } else {
    out.shoulder_r = { x: pose.shoulder_r.x + 0.015, y: pose.shoulder_r.y + 0.01 };
    out.shoulder_l = { x: pose.shoulder_l.x - 0.02, y: pose.shoulder_l.y };
  }

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
