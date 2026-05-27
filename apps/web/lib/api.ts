import type { DanceDifficulty, DancePlan, DanceStyle, SongAnalysis } from "@/types/dance";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function uploadSong(file: File): Promise<{ songId: string; audioUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/songs/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload song");
  }

  return response.json();
}

export async function analyzeSong(songId: string): Promise<SongAnalysis> {
  const response = await fetch(`${API_BASE_URL}/songs/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ songId }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze song");
  }

  return response.json();
}

export async function generateDance(input: {
  songId: string;
  bpm: number;
  style: DanceStyle;
  difficulty: DanceDifficulty;
  totalBeats: number;
}): Promise<DancePlan> {
  const response = await fetch(`${API_BASE_URL}/dances/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to generate dance");
  }

  return response.json();
}
