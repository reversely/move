"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";

import type { Choreography, JointName, JointPoint } from "@/lib/types";

type Props = {
  choreography: Choreography | null;
  bpm: number;
  audioTime: number;
  isPlaying: boolean;
};

type TimedPose = {
  t: number;
  joints: Record<JointName, JointPoint>;
};

const JOINT_ORDER: JointName[] = [
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

const LIMBS: [JointName, JointName][] = [
  ["shoulder_l", "shoulder_r"],
  ["shoulder_l", "elbow_l"],
  ["elbow_l", "wrist_l"],
  ["shoulder_r", "elbow_r"],
  ["elbow_r", "wrist_r"],
  ["hip_l", "hip_r"],
  ["hip_l", "knee_l"],
  ["knee_l", "ankle_l"],
  ["hip_r", "knee_r"],
  ["knee_r", "ankle_r"],
];

const DEFAULT_POSE: Record<JointName, JointPoint> = {
  head: { x: 0, y: 0 },
  shoulder_l: { x: -0.28, y: 0.24 },
  shoulder_r: { x: 0.28, y: 0.24 },
  elbow_l: { x: -0.42, y: 0.5 },
  elbow_r: { x: 0.42, y: 0.5 },
  wrist_l: { x: -0.42, y: 0.78 },
  wrist_r: { x: 0.42, y: 0.78 },
  hip_l: { x: -0.14, y: 0.84 },
  hip_r: { x: 0.14, y: 0.84 },
  knee_l: { x: -0.14, y: 1.27 },
  knee_r: { x: 0.14, y: 1.27 },
  ankle_l: { x: -0.14, y: 1.7 },
  ankle_r: { x: 0.14, y: 1.7 },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function blendPose(
  a: Record<JointName, JointPoint>,
  b: Record<JointName, JointPoint>,
  t: number,
): Record<JointName, JointPoint> {
  const result = {} as Record<JointName, JointPoint>;
  for (const joint of JOINT_ORDER) {
    result[joint] = {
      x: lerp(a[joint].x, b[joint].x, t),
      y: lerp(a[joint].y, b[joint].y, t),
    };
  }
  return result;
}

function toPixels(point: JointPoint, width: number, height: number): JointPoint {
  return {
    x: width * (0.5 + point.x * 0.23),
    y: height * (0.12 + (point.y / 2) * 0.76),
  };
}

function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function useTimedPoses(choreography: Choreography | null, bpm: number): { poses: TimedPose[]; duration: number } {
  return useMemo(() => {
    if (!choreography?.phrases?.length || bpm <= 0) {
      return { poses: [{ t: 0, joints: DEFAULT_POSE }], duration: 8 };
    }

    const secPerBeat = 60 / bpm;
    const poses: TimedPose[] = [];
    let maxBeat = 8;

    for (const phrase of choreography.phrases) {
      maxBeat = Math.max(maxBeat, phrase.beat + phrase.duration_beats - 1);
      for (const keyframe of phrase.keyframes) {
        poses.push({
          t: Math.max(0, (phrase.beat - 1 + keyframe.frame_offset) * secPerBeat),
          joints: keyframe.joints,
        });
      }
    }

    poses.sort((a, b) => a.t - b.t);
    if (!poses.length) poses.push({ t: 0, joints: DEFAULT_POSE });
    return { poses, duration: maxBeat * secPerBeat };
  }, [choreography, bpm]);
}

const StickFigureCanvas = forwardRef<HTMLCanvasElement, Props>(function StickFigureCanvas(
  { choreography, bpm, audioTime, isPlaying },
  forwardedRef,
) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const { poses, duration } = useTimedPoses(choreography, bpm);
  const loopTime = duration > 0 ? audioTime % duration : 0;

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let from = poses[0];
    let to = poses[0];
    for (let i = 0; i < poses.length; i += 1) {
      const current = poses[i];
      const next = poses[Math.min(i + 1, poses.length - 1)];
      if (loopTime >= current.t && loopTime <= next.t) {
        from = current;
        to = next;
        break;
      }
      if (loopTime >= poses[poses.length - 1].t) {
        from = poses[poses.length - 1];
        to = poses[0];
      }
    }

    const segment = Math.max((to.t >= from.t ? to.t - from.t : duration - from.t + to.t), 1e-4);
    const progressed = to.t >= from.t ? loopTime - from.t : loopTime >= from.t ? loopTime - from.t : duration - from.t + loopTime;
    const alpha = Math.min(Math.max(progressed / segment, 0), 1);
    const pose = blendPose(from.joints ?? DEFAULT_POSE, to.joints ?? DEFAULT_POSE, alpha);

    const { width, height } = canvas;
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, width, height);

    const points = {} as Record<JointName, JointPoint>;
    for (const joint of JOINT_ORDER) {
      points[joint] = toPixels(pose[joint], width, height);
    }
    const shoulderCenter = midpoint(points.shoulder_l, points.shoulder_r);
    const hipCenter = midpoint(points.hip_l, points.hip_r);
    const neck = midpoint(points.head, shoulderCenter);

    // floor guide line helps read lower-body motion during preview.
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width * 0.2, height * 0.9);
    ctx.lineTo(width * 0.8, height * 0.9);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(hipCenter.x, height * 0.905, 130, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e7e5e4";
    ctx.lineCap = "round";
    const drawSegment = (a: JointPoint, b: JointPoint, lineWidth: number) => {
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    drawSegment(neck, shoulderCenter, 10);
    drawSegment(shoulderCenter, hipCenter, 16);
    drawSegment(points.shoulder_l, points.shoulder_r, 13);
    drawSegment(points.hip_l, points.hip_r, 12);

    for (const [a, b] of LIMBS) {
      const isUpperLimb =
        (a === "shoulder_l" && b === "elbow_l") ||
        (a === "shoulder_r" && b === "elbow_r") ||
        (a === "hip_l" && b === "knee_l") ||
        (a === "hip_r" && b === "knee_r");
      drawSegment(points[a], points[b], isUpperLimb ? 11 : 9);
    }

    drawSegment(points.ankle_l, { x: points.ankle_l.x - 32, y: points.ankle_l.y + 8 }, 6);
    drawSegment(points.ankle_r, { x: points.ankle_r.x + 32, y: points.ankle_r.y + 8 }, 6);

    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(points.head.x, points.head.y, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#f5f5f4";
    for (const joint of JOINT_ORDER) {
      const p = points[joint];
      ctx.beginPath();
      if (joint === "head") {
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      } else if (joint === "wrist_l" || joint === "wrist_r") {
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      } else {
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "24px Inter, system-ui, sans-serif";
    ctx.fillText(isPlaying ? "PLAYING" : "PAUSED", 36, 56);
  }, [poses, duration, loopTime, isPlaying]);

  return (
    <canvas
      ref={(node) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      width={1080}
      height={1920}
      className="h-[600px] w-[337px] max-w-full rounded-xl border border-neutral-800 bg-neutral-950"
    />
  );
});

export default StickFigureCanvas;
