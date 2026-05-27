import type { JointName, JointPoint } from "@/lib/types";

const BODY_HIGHLIGHT = "#f7f5f2";
const BODY_LIGHT = "#edeae6";
const BODY = "#ddd9d4";
const BODY_SHADOW = "#b8b4ae";
const JOINT_FILL = "#f5f3f0";
const JOINT_RING = "rgba(245, 124, 32, 0.5)";

export type AvatarPoints = Record<JointName, JointPoint>;

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function limbBasis(a: JointPoint, b: JointPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { len, ux: dx / len, uy: dy / len, px: -dy / len, py: dx / len };
}

function lerpPt(a: JointPoint, b: JointPoint, t: number): JointPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Tapered limb capsule with optional muscle bulge at mid-segment. */
function drawCapsule(
  ctx: CanvasRenderingContext2D,
  a: JointPoint,
  b: JointPoint,
  radiusA: number,
  radiusB: number,
  bend = 0,
  muscle = 0,
) {
  const { len, px, py } = limbBasis(a, b);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const bulge = 1 + muscle * 0.22;
  const midR = ((radiusA + radiusB) / 2) * bulge;
  const cx = mx - py * len * bend;
  const cy = my + px * len * bend;

  const grad = ctx.createLinearGradient(a.x - px * 14, a.y - py * 14, a.x + px * 14, a.y + py * 14);
  grad.addColorStop(0, BODY_HIGHLIGHT);
  grad.addColorStop(0.4, BODY_LIGHT);
  grad.addColorStop(0.75, BODY);
  grad.addColorStop(1, BODY_SHADOW);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(a.x + px * radiusA, a.y + py * radiusA);
  ctx.quadraticCurveTo(cx + px * midR, cy + py * midR, b.x + px * radiusB, b.y + py * radiusB);
  ctx.arc(b.x, b.y, radiusB, Math.atan2(py, px), Math.atan2(-py, -px));
  ctx.quadraticCurveTo(cx - px * midR, cy - py * midR, a.x - px * radiusA, a.y - py * radiusA);
  ctx.arc(a.x, a.y, radiusA, Math.atan2(-py, -px), Math.atan2(py, px));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBallJoint(ctx: CanvasRenderingContext2D, p: JointPoint, radius: number, ring = true) {
  const highlight = ctx.createRadialGradient(p.x - radius * 0.35, p.y - radius * 0.4, 1, p.x, p.y, radius);
  highlight.addColorStop(0, "#ffffff");
  highlight.addColorStop(0.5, JOINT_FILL);
  highlight.addColorStop(1, BODY_SHADOW);
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  if (ring) {
    ctx.strokeStyle = JOINT_RING;
    ctx.lineWidth = Math.max(1.5, radius * 0.2);
    ctx.stroke();
  }
}

function drawPelvis(
  ctx: CanvasRenderingContext2D,
  spine: JointPoint,
  hipL: JointPoint,
  hipR: JointPoint,
  hipCenter: JointPoint,
) {
  const grad = ctx.createRadialGradient(hipCenter.x, hipCenter.y, 8, hipCenter.x, hipCenter.y, 55);
  grad.addColorStop(0, BODY_LIGHT);
  grad.addColorStop(1, BODY_SHADOW);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(spine.x, spine.y - 4);
  ctx.quadraticCurveTo(hipL.x - 8, hipL.y - 10, hipL.x, hipL.y);
  ctx.lineTo(hipR.x, hipR.y);
  ctx.quadraticCurveTo(hipR.x + 8, hipR.y - 10, spine.x, spine.y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawTorsoChain(
  ctx: CanvasRenderingContext2D,
  neck: JointPoint,
  chest: JointPoint,
  spine: JointPoint,
  shoulderL: JointPoint,
  shoulderR: JointPoint,
) {
  drawCapsule(ctx, neck, chest, 14, 22, 0.03, 0.15);
  drawCapsule(ctx, chest, spine, 20, 17, 0.04, 0.12);

  const shoulderMid = midpoint(shoulderL, shoulderR);
  const chestW = Math.hypot(shoulderR.x - shoulderL.x, shoulderR.y - shoulderL.y) * 0.55;

  const grad = ctx.createLinearGradient(shoulderMid.x - 40, shoulderMid.y, shoulderMid.x + 40, shoulderMid.y);
  grad.addColorStop(0, BODY_SHADOW);
  grad.addColorStop(0.35, BODY_HIGHLIGHT);
  grad.addColorStop(0.65, BODY);
  grad.addColorStop(1, BODY_SHADOW);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(shoulderL.x, shoulderL.y);
  ctx.quadraticCurveTo(chest.x - chestW * 0.4, chest.y - 12, neck.x - 10, neck.y + 2);
  ctx.lineTo(neck.x + 10, neck.y + 2);
  ctx.quadraticCurveTo(chest.x + chestW * 0.4, chest.y - 12, shoulderR.x, shoulderR.y);
  ctx.closePath();
  ctx.fill();

  // Clavicles
  ctx.strokeStyle = "rgba(0,0,0,0.09)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  for (const shoulder of [shoulderL, shoulderR]) {
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y + 4);
    ctx.quadraticCurveTo(
      (neck.x + shoulder.x) / 2,
      (neck.y + shoulder.y) / 2 - 6,
      shoulder.x,
      shoulder.y,
    );
    ctx.stroke();
  }

  // Rib cage & sternum
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chest.x, chest.y - 8);
  ctx.lineTo(spine.x, spine.y + 4);
  ctx.stroke();
  for (const offset of [-0.32, 0, 0.32]) {
    ctx.beginPath();
    ctx.moveTo(chest.x + chestW * offset, chest.y);
    ctx.quadraticCurveTo(chest.x + chestW * offset * 0.6, chest.y + 14, spine.x, spine.y);
    ctx.stroke();
  }
}

function drawHead(ctx: CanvasRenderingContext2D, head: JointPoint, neck: JointPoint, facing: number) {
  const { ux, uy } = limbBasis(neck, head);
  const crown = { x: head.x - ux * 4, y: head.y - uy * 4 };
  const tilt = facing >= 0 ? -0.07 : 0.07;

  drawCapsule(ctx, neck, crown, 10, 12, 0.03);

  const headGrad = ctx.createRadialGradient(crown.x - 12, crown.y - 16, 5, crown.x, crown.y, 44);
  headGrad.addColorStop(0, "#fcfbfa");
  headGrad.addColorStop(0.65, BODY_LIGHT);
  headGrad.addColorStop(1, BODY_SHADOW);

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(crown.x, crown.y, 32, 40, tilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.09)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Jaw + cranium contour (featureless but anatomical)
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(crown.x, crown.y + 6, 20, 24, tilt, 0.2 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(crown.x, crown.y - 8, 24, 20, tilt, 0.55 * Math.PI, 1.45 * Math.PI);
  ctx.stroke();
}

function drawHand(ctx: CanvasRenderingContext2D, wrist: JointPoint, hand: JointPoint) {
  const { ux, uy, px, py } = limbBasis(wrist, hand);
  const palm = lerpPt(wrist, hand, 0.45);

  drawCapsule(ctx, wrist, hand, 7, 9, 0.05);

  ctx.fillStyle = BODY;
  ctx.beginPath();
  ctx.ellipse(palm.x, palm.y, 13, 9, Math.atan2(uy, ux), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  for (const spread of [-1.2, -0.4, 0.4, 1.2]) {
    ctx.beginPath();
    ctx.moveTo(palm.x + px * spread * 3, palm.y + py * spread * 3);
    ctx.lineTo(
      hand.x + px * spread * 5 + ux * 4,
      hand.y + py * spread * 5 + uy * 4,
    );
    ctx.stroke();
  }

  // Thumb
  const thumbBase = { x: palm.x - px * 8, y: palm.y - py * 8 };
  ctx.beginPath();
  ctx.moveTo(thumbBase.x, thumbBase.y);
  ctx.quadraticCurveTo(
    thumbBase.x - px * 6 - ux * 4,
    thumbBase.y - py * 6 - uy * 4,
    palm.x - px * 12,
    palm.y - py * 12,
  );
  ctx.stroke();
}

function drawFoot(
  ctx: CanvasRenderingContext2D,
  ankle: JointPoint,
  toe: JointPoint,
  knee: JointPoint,
) {
  const heel = lerpPt(ankle, knee, 0.08);
  const ball = lerpPt(ankle, toe, 0.42);
  const { px, py, ux, uy } = limbBasis(ankle, toe);

  ctx.fillStyle = BODY_SHADOW;
  ctx.beginPath();
  ctx.moveTo(heel.x - px * 6, heel.y - py * 6);
  ctx.quadraticCurveTo(ball.x - px * 8, ball.y - 10, toe.x - px * 4, toe.y - py * 4);
  ctx.lineTo(toe.x + px * 4, toe.y + py * 4);
  ctx.quadraticCurveTo(ball.x + px * 8, ball.y - 8, heel.x + px * 6, heel.y + py * 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ankle.x, ankle.y);
  ctx.quadraticCurveTo(ball.x, ball.y - 6, toe.x, toe.y);
  ctx.stroke();

  drawCapsule(ctx, ankle, ball, 8, 6, 0.04);
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  hip: JointPoint,
  knee: JointPoint,
  ankle: JointPoint,
  toe: JointPoint,
  side: "l" | "r",
) {
  const bend = side === "l" ? 0.09 : -0.09;
  drawCapsule(ctx, hip, knee, 16, 13, bend, 0.35);
  drawCapsule(ctx, knee, ankle, 13, 10, bend * 0.8, 0.2);
  drawCapsule(ctx, ankle, toe, 9, 6, bend * 0.4);

  // Patella
  const patella = lerpPt(knee, ankle, 0.18);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(patella.x, patella.y, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBallJoint(ctx, knee, 10);
  drawBallJoint(ctx, ankle, 7, false);
  drawFoot(ctx, ankle, toe, knee);
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  shoulder: JointPoint,
  elbow: JointPoint,
  wrist: JointPoint,
  hand: JointPoint,
  bend: number,
) {
  drawCapsule(ctx, shoulder, elbow, 12, 10, bend, 0.25);
  drawCapsule(ctx, elbow, wrist, 10, 8, bend * 0.7, 0.15);
  drawBallJoint(ctx, shoulder, 10);
  drawBallJoint(ctx, elbow, 8);
  drawHand(ctx, wrist, hand);
  drawBallJoint(ctx, wrist, 6, false);
}

export function drawDetailedAvatar(
  ctx: CanvasRenderingContext2D,
  points: AvatarPoints,
  width: number,
  height: number,
  options: { isPlaying?: boolean; facing?: number } = {},
) {
  const hipCenter = midpoint(points.hip_l, points.hip_r);
  const facing = options.facing ?? 1;
  const floorY = height * 0.905;

  ctx.strokeStyle = "rgba(51, 51, 51, 0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.15, floorY);
  ctx.lineTo(width * 0.85, floorY);
  ctx.stroke();

  const shadowScale = 0.85 + Math.min(0.15, Math.abs(points.hip_l.x - points.hip_r.x) * 0.02);
  ctx.fillStyle = "rgba(245, 124, 32, 0.14)";
  ctx.beginPath();
  ctx.ellipse(hipCenter.x, floorY, 115 * shadowScale, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back limbs first (farther from camera)
  const leftDepth = points.wrist_l.x + points.ankle_l.x;
  const rightDepth = points.wrist_r.x + points.ankle_r.x;
  const drawLeftFirst = facing >= 0 ? leftDepth < rightDepth : leftDepth > rightDepth;

  if (drawLeftFirst) {
    drawLeg(ctx, points.hip_l, points.knee_l, points.ankle_l, points.toe_l, "l");
    drawLeg(ctx, points.hip_r, points.knee_r, points.ankle_r, points.toe_r, "r");
  } else {
    drawLeg(ctx, points.hip_r, points.knee_r, points.ankle_r, points.toe_r, "r");
    drawLeg(ctx, points.hip_l, points.knee_l, points.ankle_l, points.toe_l, "l");
  }

  drawPelvis(ctx, points.spine, points.hip_l, points.hip_r, hipCenter);
  drawTorsoChain(
    ctx,
    points.neck,
    points.chest,
    points.spine,
    points.shoulder_l,
    points.shoulder_r,
  );

  drawBallJoint(ctx, hipCenter, 10);
  drawBallJoint(ctx, points.spine, 8);
  drawBallJoint(ctx, points.chest, 9, false);

  if (drawLeftFirst) {
    drawArm(ctx, points.shoulder_l, points.elbow_l, points.wrist_l, points.hand_l, 0.11);
    drawArm(ctx, points.shoulder_r, points.elbow_r, points.wrist_r, points.hand_r, -0.11);
  } else {
    drawArm(ctx, points.shoulder_r, points.elbow_r, points.wrist_r, points.hand_r, -0.11);
    drawArm(ctx, points.shoulder_l, points.elbow_l, points.wrist_l, points.hand_l, 0.11);
  }

  drawBallJoint(ctx, points.neck, 8);
  drawHead(ctx, points.head, points.neck, facing);

  if (options.isPlaying) {
    ctx.fillStyle = "rgba(245,124,32,0.05)";
    ctx.beginPath();
    ctx.arc(points.chest.x, points.chest.y, 52, 0, Math.PI * 2);
    ctx.fill();
  }
}
