import * as THREE from "three";

import type { JointName, JointPoint } from "@/lib/types";

/** Normalized joint Y grows downward (head ≈ 0, toes ≈ 1.8). */
const BODY_Y_TOP = 1.88;
const HORIZONTAL_SCALE = 0.72;
const VERTICAL_SCALE = 0.95;

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function jointDepth(
  name: JointName,
  point: JointPoint,
  pose: Record<JointName, JointPoint>,
  facing: number,
): number {
  const chestX = pose.chest.x * facing;
  const hipMid = midpoint(pose.hip_l, pose.hip_r);

  if (name.includes("hand") || name.includes("wrist") || name.includes("elbow")) {
    const side = name.endsWith("_l") ? 1 : -1;
    const reach = (point.x * facing - chestX) * 0.22;
    return side * 0.06 + reach;
  }
  if (name.includes("shoulder")) {
    const side = name.endsWith("_l") ? 1 : -1;
    return side * 0.1;
  }
  if (name.includes("knee") || name.includes("ankle") || name.includes("toe")) {
    const hip = name.includes("_l") ? pose.hip_l : pose.hip_r;
    return (point.x * facing - hipMid.x * facing) * 0.12 + (point.y - hip.y) * 0.05;
  }
  if (name.includes("hip")) {
    const side = name.endsWith("_l") ? 1 : -1;
    return side * 0.05;
  }
  if (name === "head" || name === "neck") {
    return pose.head.x * facing * 0.04;
  }
  return (point.x * facing - hipMid.x * facing) * 0.06;
}

export function jointToLocal3D(
  point: JointPoint,
  name: JointName,
  pose: Record<JointName, JointPoint>,
  facing: number,
): THREE.Vector3 {
  const fx = point.x * facing;
  const y = (BODY_Y_TOP - point.y) * VERTICAL_SCALE;
  const z = jointDepth(name, point, pose, facing);
  return new THREE.Vector3(fx * HORIZONTAL_SCALE, y, z);
}

export function buildJointTargets3D(
  pose: Record<JointName, JointPoint>,
  facing: number,
): Record<JointName, THREE.Vector3> {
  const out = {} as Record<JointName, THREE.Vector3>;
  for (const name of Object.keys(pose) as JointName[]) {
    out[name] = jointToLocal3D(pose[name], name, pose, facing);
  }
  return out;
}

export function stageRootOffset(stage: { x: number; y: number; rotation: number }): THREE.Vector3 {
  return new THREE.Vector3(stage.x * 1.35, stage.y * 0.42, 0);
}
