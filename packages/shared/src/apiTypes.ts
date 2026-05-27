import type { DanceDifficulty, DanceStyle } from "./danceTypes";

export type DanceMove = {
  id: string;
  moveId: string;
  label: string;
  startBeat: number;
  endBeat: number;
  durationBeats: number;
  animationClip: string;
};

export type DancePlan = {
  id: string;
  songId: string;
  bpm: number;
  style: DanceStyle;
  difficulty: DanceDifficulty;
  totalBeats: number;
  moves: DanceMove[];
};
