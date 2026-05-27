export type DanceDifficulty = "easy" | "medium" | "hard";
export type DanceStyle = "fun" | "cool" | "cute" | "high_energy";

export type DanceMove = {
  id: string;
  moveId: string;
  label: string;
  startBeat: number;
  endBeat: number;
  durationBeats: number;
  animationClip: string;
};

export type SongAnalysis = {
  songId: string;
  bpm: number;
  durationSeconds: number;
  beats: number[];
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
