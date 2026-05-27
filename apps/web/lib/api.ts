import type { AudioAnalysis, Choreography, DanceStyle } from "@/lib/types";

const ANALYZER_URL = process.env.NEXT_PUBLIC_ANALYZER_URL ?? "http://127.0.0.1:8000";

export async function analyzeSong(file: File): Promise<AudioAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${ANALYZER_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Audio analysis failed: ${detail}`);
  }

  return response.json();
}

export async function generateChoreography(input: {
  analysis: AudioAnalysis;
  style: DanceStyle;
  phraseCount: number;
}): Promise<Choreography> {
  const response = await fetch("/api/choreograph", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Choreography generation failed: ${detail}`);
  }

  return response.json();
}
