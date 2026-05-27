import type { JointName, JointPoint, StageTransform } from "@/lib/types";

const JOINT_NAMES: JointName[] = [
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

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Body-local normalized coords → canvas pixels (centered). */
export function bodyToCanvasPixels(
  point: JointPoint,
  width: number,
  height: number,
): JointPoint {
  return {
    x: width * (0.5 + point.x * 0.24),
    y: height * (0.08 + (point.y / 2) * 0.82),
  };
}

/** Apply travel, lean, and facing — always upright (no flip). */
export function applyStageToSkeleton(
  bodyPixels: Record<JointName, JointPoint>,
  stage: StageTransform,
  width: number,
  height: number,
): Record<JointName, JointPoint> {
  const hip = midpoint(bodyPixels.hip_l, bodyPixels.hip_r);
  const rootX = width * 0.5 + stage.x * width * 0.34;
  const rootY = height * 0.54 - stage.y * height * 0.22;
  const totalRot = stage.rotation * (Math.PI / 180);
  const cos = Math.cos(totalRot);
  const sin = Math.sin(totalRot);
  const face = stage.facing >= 0 ? 1 : -1;

  const out = {} as Record<JointName, JointPoint>;
  for (const name of JOINT_NAMES) {
    let lx = (bodyPixels[name].x - hip.x) * face;
    let ly = bodyPixels[name].y - hip.y;
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;
    out[name] = { x: rootX + rx, y: rootY + ry };
  }

  if (stage.head_turn !== 0) {
    const shoulderMid = midpoint(out.shoulder_l, out.shoulder_r);
    const turnPx = stage.head_turn * width * 0.025;
    out.head = {
      x: out.head.x + turnPx,
      y: Math.min(out.head.y, shoulderMid.y - height * 0.02),
    };
  }

  return out;
}
