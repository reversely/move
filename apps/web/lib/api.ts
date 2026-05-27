import type { AudioAnalysis, Choreography, ClipRange, DanceStyle } from "@/lib/types";

const ANALYZER_URL = process.env.NEXT_PUBLIC_ANALYZER_URL ?? "http://127.0.0.1:8000";

export async function analyzeSong(file: File, clip?: ClipRange): Promise<AudioAnalysis> {
  const formData = new FormData();
  formData.append("file", file);
  if (clip) {
    formData.append("start_seconds", String(clip.start));
    formData.append("end_seconds", String(clip.end));
  }

  const response = await fetch(`${ANALYZER_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { detail?: string };
      if (parsed.detail) detail = parsed.detail;
    } catch {
      // keep raw body
    }
    if (response.status >= 500 || response.status === 0) {
      throw new Error(
        "Could not reach the analyzer service. Start it with `pnpm dev:api` or `pnpm dev`.",
      );
    }
    throw new Error(detail || `Audio analysis failed (${response.status})`);
  }

  const data = (await response.json()) as AudioAnalysis;
  return {
    ...data,
    clip_start_seconds: data.clip_start_seconds ?? clip?.start ?? 0,
    clip_end_seconds: data.clip_end_seconds ?? clip?.end ?? data.duration_seconds,
    source_duration_seconds: data.source_duration_seconds ?? data.duration_seconds,
  };
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
