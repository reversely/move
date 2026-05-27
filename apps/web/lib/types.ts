export type DanceStyle = "hype" | "smooth" | "quirky";

export type JointName =
  | "head"
  | "shoulder_l"
  | "shoulder_r"
  | "elbow_l"
  | "elbow_r"
  | "wrist_l"
  | "wrist_r"
  | "hip_l"
  | "hip_r"
  | "knee_l"
  | "knee_r"
  | "ankle_l"
  | "ankle_r";

export type JointPoint = {
  x: number;
  y: number;
};

/** Stage position — dancer travels, turns, flips on the canvas. */
export type StageTransform = {
  /** Horizontal position on stage: -1 (left) to 1 (right). */
  x: number;
  /** Vertical lift (jump height). Positive = up. */
  y: number;
  /** Body lean in degrees (capped, always upright). */
  rotation: number;
  /** Reserved — always 0 (no upside-down). */
  flip: number;
  /** 1 = facing right, -1 = facing left (mirrors body). */
  facing: number;
  /** Head look direction -1 to 1 (left to right). */
  head_turn: number;
};

export type Keyframe = {
  frame_offset: number;
  joints: Record<JointName, JointPoint>;
  stage?: StageTransform;
};

export type ChoreoPhrase = {
  beat: number;
  duration_beats: number;
  keyframes: Keyframe[];
};

export type ChoreographyMeta = {
  vibe?: string;
  tiktok_style?: string;
  human_notes?: string;
  move_catalog?: string;
  viral_sequences?: string;
};

export type Choreography = {
  phrases: ChoreoPhrase[];
  meta?: ChoreographyMeta;
};

export type AudioAnalysis = {
  bpm: number;
  beat_times: number[];
  onset_per_beat: number[];
  percussive_ratio: number;
  spectral_bands: {
    bass: number;
    mid: number;
    treble: number;
  };
  key: string;
  duration_seconds: number;
  clip_start_seconds: number;
  clip_end_seconds: number;
  source_duration_seconds: number;
};

export type ClipRange = {
  start: number;
  end: number;
};
