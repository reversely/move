"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

import { drawDetailedAvatar } from "@/lib/avatarDraw";
import { BASE_POSE } from "@/lib/basePose";
import { clampStagePhysics } from "@/lib/dancePhysics";
import { easeInOutQuint, interpolatePoseAtTime } from "@/lib/poseInterpolation";
import { blendStage, DEFAULT_STAGE } from "@/lib/stageMotion";
import { applyStageToSkeleton, bodyToCanvasPixels } from "@/lib/stageRender";
import type { Choreography, JointName, JointPoint, StageTransform } from "@/lib/types";

type Props = {
  choreography: Choreography | null;
  bpm: number;
  playbackTime: number;
  clipDuration?: number;
  isPlaying?: boolean;
  hasAnalysis?: boolean;
};

type TimedPose = {
  t: number;
  joints: Record<JointName, JointPoint>;
  stage: StageTransform;
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

function useTimedPoses(choreography: Choreography | null, bpm: number): { poses: TimedPose[]; duration: number } {
  return useMemo(() => {
    if (!choreography?.phrases?.length || bpm <= 0) {
      return { poses: [{ t: 0, joints: BASE_POSE, stage: DEFAULT_STAGE }], duration: 8 };
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
          stage: clampStagePhysics(keyframe.stage ?? DEFAULT_STAGE),
        });
      }
    }

    poses.sort((a, b) => a.t - b.t);
    if (!poses.length) poses.push({ t: 0, joints: BASE_POSE, stage: DEFAULT_STAGE });
    return { poses, duration: maxBeat * secPerBeat };
  }, [choreography, bpm]);
}

function drawStageFloor(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const floorY = height * 0.9;
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const x = width * (0.15 + i * 0.175);
    ctx.beginPath();
    ctx.moveTo(x, floorY - 40);
    ctx.lineTo(x, floorY);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(245,124,32,0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, floorY);
  ctx.lineTo(width * 0.9, floorY);
  ctx.stroke();
}

const StickFigureCanvas = forwardRef<HTMLCanvasElement, Props>(function StickFigureCanvas(
  { choreography, bpm, playbackTime, clipDuration, isPlaying = false, hasAnalysis },
  forwardedRef,
) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const { poses, duration } = useTimedPoses(choreography, bpm);
  const maxDanceTime =
    clipDuration != null && clipDuration > 0
      ? Math.min(duration, clipDuration)
      : duration;
  const danceTime =
    maxDanceTime > 0 ? Math.min(Math.max(0, playbackTime), maxDanceTime - 1e-4) : 0;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isPlaying || !choreography) return;
    let raf = 0;
    const tick = () => {
      setFrame((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, choreography]);

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let from = poses[0];
    let to = poses.length > 1 ? poses[1] : poses[0];
    for (let i = 0; i < poses.length - 1; i += 1) {
      const current = poses[i];
      const next = poses[i + 1];
      if (danceTime >= current.t && danceTime < next.t) {
        from = current;
        to = next;
        break;
      }
      if (i === poses.length - 2 && danceTime >= next.t) {
        from = next;
        to = next;
      }
    }

    const segment = Math.max(to.t - from.t, 1e-4);
    const alpha = easeInOutQuint(Math.min(Math.max((danceTime - from.t) / segment, 0), 1));
    const stage = blendStage(from.stage, to.stage, alpha);
    const pose = interpolatePoseAtTime(poses, danceTime, BASE_POSE);

    const { width, height } = canvas;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#2d2a28");
    gradient.addColorStop(1, "#1a1917");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawStageFloor(ctx, width, height);

    const bodyPixels = {} as Record<JointName, JointPoint>;
    for (const joint of JOINT_ORDER) {
      bodyPixels[joint] = bodyToCanvasPixels(pose[joint], width, height);
    }
    const points = applyStageToSkeleton(bodyPixels, stage, width, height);

    drawDetailedAvatar(ctx, points, width, height, { isPlaying, facing: stage.facing });
  }, [poses, duration, danceTime, frame, isPlaying]);

  const showPlaceholder = !choreography;

  return (
    <div className="relative">
      <div className="rounded-[2rem] border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] p-1.5 shadow-[var(--shadow-card-hover)] ring-1 ring-[var(--color-brand)]/10">
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
          className="block h-[min(80vh,720px)] w-auto max-w-full rounded-[1.5rem] bg-[#1a1917]"
        />
      </div>
      {showPlaceholder && hasAnalysis && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2rem] p-8">
          <p className="max-w-[220px] text-center text-sm leading-relaxed text-[var(--color-text-muted)]">
            Generate a dance to preview your stick figure
          </p>
        </div>
      )}
    </div>
  );
});

export default StickFigureCanvas;
