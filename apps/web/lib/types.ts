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

export type Keyframe = {
  frame_offset: number;
  joints: Record<JointName, JointPoint>;
};

export type ChoreoPhrase = {
  beat: number;
  duration_beats: number;
  keyframes: Keyframe[];
};

export type Choreography = {
  phrases: ChoreoPhrase[];
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
};
