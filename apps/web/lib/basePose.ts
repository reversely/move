import type { CoreJointName, JointName, JointPoint } from "@/lib/types";

/** Neutral standing pose — shared by moves and physics (no other lib imports). */
export const BASE_POSE: Record<JointName, JointPoint> = {
  head: { x: 0, y: 0 },
  neck: { x: 0, y: 0.1 },
  chest: { x: 0, y: 0.36 },
  spine: { x: 0, y: 0.58 },
  shoulder_l: { x: -0.3, y: 0.2 },
  shoulder_r: { x: 0.3, y: 0.2 },
  elbow_l: { x: -0.45, y: 0.45 },
  elbow_r: { x: 0.45, y: 0.45 },
  wrist_l: { x: -0.5, y: 0.7 },
  wrist_r: { x: 0.5, y: 0.7 },
  hand_l: { x: -0.54, y: 0.76 },
  hand_r: { x: 0.54, y: 0.76 },
  hip_l: { x: -0.18, y: 0.82 },
  hip_r: { x: 0.18, y: 0.82 },
  knee_l: { x: -0.22, y: 1.18 },
  knee_r: { x: 0.22, y: 1.18 },
  ankle_l: { x: -0.26, y: 1.68 },
  ankle_r: { x: 0.26, y: 1.68 },
  toe_l: { x: -0.34, y: 1.76 },
  toe_r: { x: 0.34, y: 1.76 },
};

export const JOINT_NAMES = Object.keys(BASE_POSE) as JointName[];

export const CORE_JOINT_NAMES: CoreJointName[] = [
  "head",
  "shoulder_l",
  "shoulder_r",
  "elbow_l",
  "elbow_r",
  "wrist_l",
  "wrist_r",
  "hip_l",
  "hip_r",
  "knee_l",
  "knee_r",
  "ankle_l",
  "ankle_r",
];
