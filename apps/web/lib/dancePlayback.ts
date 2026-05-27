import type { JointName, JointPoint, StageTransform } from "@/lib/types";

/** One choreography sample on the dance timeline (seconds). */
export type TimedPoseInput = {
  t: number;
  joints: Record<JointName, JointPoint>;
  stage: StageTransform;
};

/** Mutable clock — updated on the audio RAF thread, read inside R3F useFrame. */
export type DancePlaybackClock = {
  relativeTime: number;
  isPlaying: boolean;
  poses: TimedPoseInput[];
  danceDuration: number;
  clipDuration: number;
};

export const dancePlaybackClock: DancePlaybackClock = {
  relativeTime: 0,
  isPlaying: false,
  poses: [],
  danceDuration: 8,
  clipDuration: 0,
};

export function resetDancePlaybackClock() {
  dancePlaybackClock.relativeTime = 0;
  dancePlaybackClock.isPlaying = false;
}

/** Clip-relative dance time in seconds, clamped to the shorter of clip vs choreography. */
export function sampleDanceTimeSeconds(): number {
  const { relativeTime, danceDuration, clipDuration } = dancePlaybackClock;
  const cap =
    clipDuration > 0 && danceDuration > 0
      ? Math.min(danceDuration, clipDuration)
      : danceDuration > 0
        ? danceDuration
        : clipDuration;
  return cap > 0 ? Math.min(Math.max(0, relativeTime), cap - 1e-4) : 0;
}
