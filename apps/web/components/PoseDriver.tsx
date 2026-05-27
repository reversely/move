"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";

import type { DanceAvatarAnimRef } from "@/components/DanceAvatarScene";
import { BASE_POSE } from "@/lib/basePose";
import { dancePlaybackClock, sampleDanceTimeSeconds } from "@/lib/dancePlayback";
import { interpolatePoseAtTime, smoothTowardPose } from "@/lib/poseInterpolation";
import { DEFAULT_STAGE, interpolateStageAtTime, smoothTowardStage } from "@/lib/stageMotion";
import type { JointName, JointPoint, StageTransform } from "@/lib/types";

/** Higher = snappier follow during playback (was 0.32 — too sluggish vs keyframe rate). */
const DISPLAY_SMOOTH = 0.72;

type Props = {
  animRef: RefObject<DanceAvatarAnimRef>;
};

/** Samples choreography each frame from the audio clock (not React state). */
export default function PoseDriver({ animRef }: Props) {
  const smoothedPoseRef = useRef<Record<JointName, JointPoint> | null>(null);
  const smoothedStageRef = useRef<StageTransform | null>(null);
  const lastDanceTimeRef = useRef(0);

  useFrame(() => {
    const { poses, isPlaying } = dancePlaybackClock;
    const danceTime = sampleDanceTimeSeconds();

    if (Math.abs(danceTime - lastDanceTimeRef.current) > 0.2) {
      smoothedPoseRef.current = null;
      smoothedStageRef.current = null;
    }
    lastDanceTimeRef.current = danceTime;

    const targetPose = interpolatePoseAtTime(poses, danceTime, BASE_POSE, { playback: true });
    const targetStage = interpolateStageAtTime(poses, danceTime, DEFAULT_STAGE);
    const smoothFactor = isPlaying ? DISPLAY_SMOOTH : 1;
    const pose = smoothTowardPose(smoothedPoseRef.current, targetPose, smoothFactor);
    const stage = smoothTowardStage(smoothedStageRef.current, targetStage, smoothFactor);
    smoothedPoseRef.current = pose;
    smoothedStageRef.current = stage;

    animRef.current = { pose, stage, isPlaying };
  }, -1);

  return null;
}
