import type { JointName, JointPoint } from "@/lib/types";

const BRAND = "#f57c20";
const SKIN = "#f4f4f5";
const LIMB = "#e4e4e7";
const LIMB_SHADOW = "#a1a1aa";

export type AvatarPoints = Record<JointName, JointPoint>;

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function footTip(ankle: JointPoint, side: "l" | "r"): JointPoint {
  return { x: ankle.x + (side === "l" ? -36 : 36), y: ankle.y + 12 };
}

function handFingers(ctx: CanvasRenderingContext2D, wrist: JointPoint, elbow: JointPoint) {
  const dx = wrist.x - elbow.x;
  const dy = wrist.y - elbow.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.strokeStyle = LIMB_SHADOW;
  ctx.lineWidth = 3;
  for (const spread of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    ctx.lineTo(wrist.x + nx * 14 * spread + dx * 0.12, wrist.y + ny * 14 * spread + dy * 0.12);
    ctx.stroke();
  }
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  a: JointPoint,
  b: JointPoint,
  width: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export function drawDetailedAvatar(
  ctx: CanvasRenderingContext2D,
  points: AvatarPoints,
  width: number,
  height: number,
  options: { isPlaying?: boolean; facing?: number } = {},
) {
  const shoulderCenter = midpoint(points.shoulder_l, points.shoulder_r);
  const hipCenter = midpoint(points.hip_l, points.hip_r);
  const neck = {
    x: shoulderCenter.x + (points.head.x - shoulderCenter.x) * 0.35,
    y: shoulderCenter.y + (points.head.y - shoulderCenter.y) * 0.25,
  };
  const chest = {
    x: (shoulderCenter.x + hipCenter.x) / 2,
    y: (shoulderCenter.y + hipCenter.y) / 2 - 8,
  };

  const floorY = height * 0.905;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.15, floorY);
  ctx.lineTo(width * 0.85, floorY);
  ctx.stroke();

  const shadowScale = 0.85 + Math.min(0.15, Math.abs(points.hip_l.x - points.hip_r.x) * 0.02);
  ctx.fillStyle = "rgba(245,124,32,0.12)";
  ctx.beginPath();
  ctx.ellipse(hipCenter.x, floorY, 120 * shadowScale, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawLeg = (side: "l" | "r") => {
    const hip = side === "l" ? points.hip_l : points.hip_r;
    const knee = side === "l" ? points.knee_l : points.knee_r;
    const ankle = side === "l" ? points.ankle_l : points.ankle_r;
    const foot = footTip(ankle, side);
    drawLimb(ctx, hip, knee, 17, SKIN);
    drawLimb(ctx, knee, ankle, 14, LIMB);
    drawLimb(ctx, ankle, foot, 10, LIMB_SHADOW);
    ctx.fillStyle = "#d4d4d8";
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  drawLeg("l");
  drawLeg("r");

  ctx.fillStyle = "rgba(228,228,231,0.35)";
  ctx.beginPath();
  ctx.moveTo(points.shoulder_l.x, points.shoulder_l.y);
  ctx.lineTo(points.shoulder_r.x, points.shoulder_r.y);
  ctx.lineTo(points.hip_r.x, points.hip_r.y);
  ctx.lineTo(points.hip_l.x, points.hip_l.y);
  ctx.closePath();
  ctx.fill();

  drawLimb(ctx, points.hip_l, points.hip_r, 11, LIMB_SHADOW);
  drawLimb(ctx, neck, shoulderCenter, 12, SKIN);
  drawLimb(ctx, shoulderCenter, hipCenter, 18, SKIN);
  drawLimb(ctx, points.shoulder_l, points.shoulder_r, 14, LIMB);

  const arms: [JointName, JointName, JointName][] = [
    ["shoulder_l", "elbow_l", "wrist_l"],
    ["shoulder_r", "elbow_r", "wrist_r"],
  ];
  for (const [s, e, w] of arms) {
    drawLimb(ctx, points[s], points[e], 12, SKIN);
    drawLimb(ctx, points[e], points[w], 10, LIMB);
    handFingers(ctx, points[w], points[e]);
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(points[w].x, points[w].y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = BRAND;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const headR = 40;
  const headGrad = ctx.createRadialGradient(
    points.head.x - 8,
    points.head.y - 10,
    4,
    points.head.x,
    points.head.y,
    headR,
  );
  headGrad.addColorStop(0, "#fafafa");
  headGrad.addColorStop(1, "#d4d4d8");
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(points.head.x, points.head.y, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BRAND;
  ctx.lineWidth = 5;
  ctx.stroke();

  const faceDir = (options.facing ?? 1) >= 0 ? 1 : -1;
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.ellipse(points.head.x - 12 * faceDir, points.head.y - 4, 5, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(points.head.x + 12 * faceDir, points.head.y - 4, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(points.head.x, points.head.y + 10, 10, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  if (options.isPlaying) {
    ctx.fillStyle = "rgba(245,124,32,0.08)";
    ctx.beginPath();
    ctx.arc(chest.x, chest.y, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  const jointSizes: Partial<Record<JointName, number>> = {
    knee_l: 7,
    knee_r: 7,
    ankle_l: 8,
    ankle_r: 8,
    elbow_l: 5,
    elbow_r: 5,
  };
  for (const name of Object.keys(points) as JointName[]) {
    if (name === "head") continue;
    const p = points[name];
    const r = jointSizes[name] ?? 4;
    ctx.fillStyle = name.includes("hip") || name.includes("shoulder") ? BRAND : "#fafafa";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
