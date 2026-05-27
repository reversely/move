import type { JointName, JointPoint } from "@/lib/types";

/** Neutral standing pose — shared by moves and physics (no other lib imports). */
export const BASE_POSE: Record<JointName, JointPoint> = {
  head: { x: 0, y: 0 },
  shoulder_l: { x: -0.3, y: 0.2 },
  shoulder_r: { x: 0.3, y: 0.2 },
  elbow_l: { x: -0.45, y: 0.45 },
  elbow_r: { x: 0.45, y: 0.45 },
  wrist_l: { x: -0.5, y: 0.7 },
  wrist_r: { x: 0.5, y: 0.7 },
  hip_l: { x: -0.18, y: 0.82 },
  hip_r: { x: 0.18, y: 0.82 },
  knee_l: { x: -0.22, y: 1.18 },
  knee_r: { x: 0.22, y: 1.18 },
  ankle_l: { x: -0.26, y: 1.68 },
  ankle_r: { x: 0.26, y: 1.68 },
};

export const JOINT_NAMES = Object.keys(BASE_POSE) as JointName[];
