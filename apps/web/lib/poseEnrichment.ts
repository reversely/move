import { BASE_POSE } from "@/lib/basePose";
import type { JointName, JointPoint } from "@/lib/types";

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function limbDir(from: JointPoint, to: JointPoint, len = 0.1): JointPoint {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mag = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / mag) * len, y: from.y + (dy / mag) * len };
}

/** Fill torso, hand, and toe joints when choreography only has the core 13. */
export function enrichPose(pose: Partial<Record<JointName, JointPoint>>): Record<JointName, JointPoint> {
  const out = { ...BASE_POSE, ...pose } as Record<JointName, JointPoint>;
  const shoulderMid = midpoint(out.shoulder_l, out.shoulder_r);
  const hipMid = midpoint(out.hip_l, out.hip_r);

  if (pose.neck === undefined) {
    out.neck = {
      x: shoulderMid.x + (out.head.x - shoulderMid.x) * 0.48,
      y: shoulderMid.y + (out.head.y - shoulderMid.y) * 0.42,
    };
  }

  if (pose.chest === undefined) {
    out.chest = {
      x: shoulderMid.x * 0.35 + hipMid.x * 0.65,
      y: shoulderMid.y + (hipMid.y - shoulderMid.y) * 0.28,
    };
  }

  if (pose.spine === undefined) {
    out.spine = {
      x: out.chest.x * 0.4 + hipMid.x * 0.6,
      y: out.chest.y + (hipMid.y - out.chest.y) * 0.52,
    };
  }

  for (const side of ["l", "r"] as const) {
    const wrist = out[`wrist_${side}`];
    const elbow = out[`elbow_${side}`];
    const ankle = out[`ankle_${side}`];
    const knee = out[`knee_${side}`];
    if (pose[`hand_${side}`] === undefined) {
      out[`hand_${side}`] = limbDir(elbow, wrist, 0.1);
    }

    if (pose[`toe_${side}`] === undefined) {
      const forward = limbDir(knee, ankle, 0.12);
      const lateral = side === "l" ? -0.04 : 0.04;
      out[`toe_${side}`] = {
        x: ankle.x + forward.x + lateral,
        y: ankle.y + Math.max(0.05, forward.y * 0.4),
      };
    }
  }

  return out;
}
