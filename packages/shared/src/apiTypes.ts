import type { DanceStyle } from "./danceTypes";

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

export type JointPoint = {
  x: number;
  y: number;
};

export type JointMap = Record<string, JointPoint>;

export type ChoreographyPhrase = {
  beat: number;
  duration_beats: number;
  keyframes: Array<{
    frame_offset: number;
    joints: JointMap;
  }>;
};

export type ChoreographyPayload = {
  analysis: AudioAnalysis;
  style: DanceStyle;
  phraseCount: number;
};

export type Choreography = {
  phrases: ChoreographyPhrase[];
};
