"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";

import { drawDetailedAvatar } from "@/lib/avatarDraw";
import { BASE_POSE, JOINT_NAMES } from "@/lib/basePose";
import { buildTimedPoses } from "@/lib/buildTimedPoses";
import { dancePlaybackClock, sampleDanceTimeSeconds } from "@/lib/dancePlayback";
import { interpolatePoseAtTime, smoothTowardPose } from "@/lib/poseInterpolation";
import { DEFAULT_STAGE, interpolateStageAtTime, smoothTowardStage } from "@/lib/stageMotion";
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

/** TikTok vertical export / preview */
export const RENDER_WIDTH = 1080;
export const RENDER_HEIGHT = 1920;
const PREVIEW_ASPECT = `${RENDER_WIDTH} / ${RENDER_HEIGHT}`;

const DISPLAY_SMOOTH = 0.72;

const PREVIEW_BG_TOP = "#f5f5f0";
const PREVIEW_BG_BOTTOM = "#eeeee8";

function drawPreviewBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, PREVIEW_BG_TOP);
  gradient.addColorStop(1, PREVIEW_BG_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawStageFloor(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const floorY = height * 0.9;
  ctx.strokeStyle = "rgba(51, 51, 51, 0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const x = width * (0.15 + i * 0.175);
    ctx.beginPath();
    ctx.moveTo(x, floorY - 40);
    ctx.lineTo(x, floorY);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(245, 124, 32, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, floorY);
  ctx.lineTo(width * 0.9, floorY);
  ctx.stroke();
}

const StickFigureCanvas = forwardRef<HTMLCanvasElement, Props>(function StickFigureCanvas(
  { choreography, bpm, clipDuration, hasAnalysis },
  forwardedRef,
) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedPoseRef = useRef<Record<JointName, JointPoint> | null>(null);
  const smoothedStageRef = useRef<StageTransform | null>(null);
  const lastDanceTimeRef = useRef(0);

  const { poses, duration } = useMemo(() => {
    const built = buildTimedPoses(choreography, bpm);
    dancePlaybackClock.poses = built.poses;
    dancePlaybackClock.danceDuration = built.duration;
    return built;
  }, [choreography, bpm]);

  useEffect(() => {
    dancePlaybackClock.clipDuration = clipDuration ?? 0;
  }, [clipDuration]);

  useEffect(() => {
    smoothedPoseRef.current = null;
    smoothedStageRef.current = null;
    lastDanceTimeRef.current = 0;
  }, [choreography, bpm]);

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas) return;

    let raf = 0;

    const frame = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const danceTime = sampleDanceTimeSeconds();
      const isPlaying = dancePlaybackClock.isPlaying;
      const timeline = dancePlaybackClock.poses;

      if (Math.abs(danceTime - lastDanceTimeRef.current) > 0.2) {
        smoothedPoseRef.current = null;
        smoothedStageRef.current = null;
      }
      lastDanceTimeRef.current = danceTime;

      const targetPose = interpolatePoseAtTime(timeline, danceTime, BASE_POSE, { playback: true });
      const targetStage = interpolateStageAtTime(timeline, danceTime, DEFAULT_STAGE);
      const smoothFactor = isPlaying ? DISPLAY_SMOOTH : 1;
      const pose = smoothTowardPose(smoothedPoseRef.current, targetPose, smoothFactor);
      const stage = smoothTowardStage(smoothedStageRef.current, targetStage, smoothFactor);
      smoothedPoseRef.current = pose;
      smoothedStageRef.current = stage;

      const { width, height } = canvas;
      drawPreviewBackground(ctx, width, height);
      drawStageFloor(ctx, width, height);

      const bodyPixels = {} as Record<JointName, JointPoint>;
      for (const joint of JOINT_NAMES) {
        bodyPixels[joint] = bodyToCanvasPixels(pose[joint], width, height);
      }
      const points = applyStageToSkeleton(bodyPixels, stage, width, height);
      drawDetailedAvatar(ctx, points, width, height, { isPlaying, facing: stage.facing });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [poses, duration]);

  const showPlaceholder = !choreography;

  return (
    <div className="relative">
      <div className="rounded-[2rem] border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] p-1.5 shadow-[var(--shadow-card-hover)] ring-1 ring-[var(--color-brand)]/10">
        <div
          className="relative mx-auto h-[min(80vh,720px)] w-auto max-w-full overflow-hidden rounded-[1.5rem] bg-[var(--color-bg)]"
          style={{ aspectRatio: PREVIEW_ASPECT }}
        >
          <canvas
            ref={(node) => {
              internalRef.current = node;
              if (typeof forwardedRef === "function") {
                forwardedRef(node);
              } else if (forwardedRef) {
                forwardedRef.current = node;
              }
            }}
            width={RENDER_WIDTH}
            height={RENDER_HEIGHT}
            className="block h-full w-full rounded-[1.5rem]"
          />
        </div>
      </div>
      {showPlaceholder && hasAnalysis && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2rem] p-8">
          <p className="max-w-[220px] text-center text-sm leading-relaxed text-[var(--color-text-muted)]">
            Generate a dance to preview your dancer
          </p>
        </div>
      )}
    </div>
  );
});

export default StickFigureCanvas;
