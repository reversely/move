import { BASE_POSE } from "@/lib/basePose";
import { clampStagePhysics } from "@/lib/dancePhysics";
import type { TimedPoseInput } from "@/lib/dancePlayback";
import { DEFAULT_STAGE } from "@/lib/stageMotion";
import type { Choreography } from "@/lib/types";

export function buildTimedPoses(
  choreography: Choreography | null,
  bpm: number,
): { poses: TimedPoseInput[]; duration: number } {
  if (!choreography?.phrases?.length || bpm <= 0) {
    return { poses: [{ t: 0, joints: BASE_POSE, stage: DEFAULT_STAGE }], duration: 8 };
  }

  const secPerBeat = 60 / bpm;
  const poses: TimedPoseInput[] = [];
  let endBeat = 0;

  choreography.phrases.forEach((phrase, phraseIndex) => {
    const durationBeats = phrase.duration_beats > 0 ? phrase.duration_beats : 8;
    /** Phrase index — do not rely on phrase.beat (API often repeats beat: 1). */
    const phraseStartBeat = phraseIndex * durationBeats;
    endBeat = Math.max(endBeat, phraseStartBeat + durationBeats);

    for (const keyframe of phrase.keyframes) {
      poses.push({
        t: Math.max(0, (phraseStartBeat + keyframe.frame_offset) * secPerBeat),
        joints: keyframe.joints,
        stage: clampStagePhysics(keyframe.stage ?? DEFAULT_STAGE),
      });
    }
  });

  poses.sort((a, b) => a.t - b.t);

  // Drop duplicate timestamps (keep the later keyframe — usually more specific).
  const deduped: TimedPoseInput[] = [];
  for (const pose of poses) {
    const last = deduped[deduped.length - 1];
    if (last && Math.abs(last.t - pose.t) < 1e-6) {
      deduped[deduped.length - 1] = pose;
    } else {
      deduped.push(pose);
    }
  }

  if (!deduped.length) {
    deduped.push({ t: 0, joints: BASE_POSE, stage: DEFAULT_STAGE });
  }

  return { poses: deduped, duration: endBeat * secPerBeat };
}
